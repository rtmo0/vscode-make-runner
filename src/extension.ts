import * as path from 'node:path';
import * as vscode from 'vscode';

interface RunnerCommand {
  label: string;
  command: string;
  cwd?: string;
  description?: string;
}

interface MakeTarget {
  name: string;
  dir: string;
  range: vscode.Range;
}

const MAKEFILE_LANGUAGE = 'makefile';

let sharedTerminal: vscode.Terminal | undefined;
let statusBarItem: vscode.StatusBarItem | undefined;

class MakeCodeLensProvider implements vscode.CodeLensProvider {
  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    if (document.languageId !== MAKEFILE_LANGUAGE || document.uri.scheme !== 'file') {
      return [];
    }

    return getMakeTargets(document).map((target) => {
      const lens = new vscode.CodeLens(target.range);
      lens.command = {
        command: 'makefile-target-launcher.runMakeTarget',
        title: `$(play) Run ${target.name}`,
        arguments: [{ name: target.name, dir: target.dir }]
      };
      return lens;
    });
  }
}

export function activate(context: vscode.ExtensionContext): void {
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.name = 'Makefile Target Launcher';
  statusBarItem.command = 'makefile-target-launcher.runCommand';
  statusBarItem.tooltip = 'Run a Makefile Target Launcher command';
  statusBarItem.show();
  updateStatusBar();

  context.subscriptions.push(
    statusBarItem,
    vscode.languages.registerCodeLensProvider(
      { language: MAKEFILE_LANGUAGE, scheme: 'file' },
      new MakeCodeLensProvider()
    ),
    vscode.commands.registerCommand('makefile-target-launcher.runMakeTarget', (target?: MakeTarget) => {
      if (target) {
        runMakeTarget(target);
      }
    }),
    vscode.commands.registerCommand('makefile-target-launcher.configure', () =>
      vscode.commands.executeCommand('workbench.action.openSettings', 'makefile-target-launcher.commands')
    ),
    vscode.commands.registerCommand('makefile-target-launcher.runCommand', async (command?: RunnerCommand) => {
      const selected = command ?? await pickCommand();
      if (selected) {
        runInTerminal(selected);
      }
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('makefile-target-launcher.commands')) {
        updateStatusBar();
      }
      if (event.affectsConfiguration('makefile-target-launcher.reuseTerminal') && !shouldReuseTerminal()) {
        sharedTerminal = undefined;
      }
    }),
    vscode.window.onDidCloseTerminal((terminal) => {
      if (terminal === sharedTerminal) {
        sharedTerminal = undefined;
      }
    })
  );
}

export function deactivate(): void {
  sharedTerminal = undefined;
  statusBarItem?.dispose();
  statusBarItem = undefined;
}

function getMakeTargets(document: vscode.TextDocument): MakeTarget[] {
  const dir = path.dirname(document.uri.fsPath);
  const targets: MakeTarget[] = [];

  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i).text;

    // Targets must start at column 0; recipes are indented.
    if (line.length === 0 || line[0] === ' ' || line[0] === '\t' || line.startsWith('#')) {
      continue;
    }
    // Skip variable assignments (also :=, ?=, +=).
    if (line.includes('=')) {
      continue;
    }

    const match = /^([^:\s][^:]*?)\s*:+(?!=)/.exec(line);
    if (!match) {
      continue;
    }

    const name = match[1].trim();
    if (!name || name.startsWith('.') || name.includes('%')) {
      continue;
    }

    targets.push({
      name,
      dir,
      range: new vscode.Range(i, 0, i, match[0].length)
    });
  }

  return targets;
}

function runMakeTarget(target: MakeTarget): void {
  const terminal = getTerminal(`make ${target.name}`, target.dir);
  terminal.show(true);
  // `-C` keeps the build directory correct even when reusing a terminal
  // whose cwd was set by a previous command.
  terminal.sendText(`make -C "${target.dir}" ${target.name}`, true);
}

function updateStatusBar(): void {
  if (!statusBarItem) {
    return;
  }
  const count = getCommands().length;
  if (count === 0) {
    statusBarItem.text = '$(terminal) Makefile Target Launcher';
    statusBarItem.tooltip = 'No Makefile Target Launcher commands configured. Click to configure.';
  } else {
    statusBarItem.text = `$(terminal) Makefile Target Launcher (${count})`;
    statusBarItem.tooltip = `Run one of ${count} Makefile Target Launcher command(s)`;
  }
}

function getCommands(): RunnerCommand[] {
  const configured = vscode.workspace.getConfiguration('makefile-target-launcher').get<RunnerCommand[]>('commands', []);
  return configured.filter((item) =>
    typeof item?.label === 'string' && item.label.trim().length > 0 &&
    typeof item.command === 'string' && item.command.trim().length > 0
  );
}

async function pickCommand(): Promise<RunnerCommand | undefined> {
  const commands = getCommands();
  if (commands.length === 0) {
    const action = await vscode.window.showInformationMessage(
      'No Makefile Target Launcher commands are configured.',
      'Configure'
    );
    if (action === 'Configure') {
      await vscode.commands.executeCommand('makefile-target-launcher.configure');
    }
    return undefined;
  }

  const picked = await vscode.window.showQuickPick(
    commands.map((command) => ({
      label: command.label,
      description: command.description,
      detail: command.command,
      command
    })),
    { placeHolder: 'Select a command to run', matchOnDescription: true, matchOnDetail: true }
  );
  return picked?.command;
}

function runInTerminal(definition: RunnerCommand): void {
  const workspaceFolder = getWorkspaceFolder();
  const cwd = resolveVariables(definition.cwd ?? workspaceFolder?.uri.fsPath, workspaceFolder);
  const command = resolveVariables(definition.command, workspaceFolder) ?? definition.command;
  const terminal = getTerminal(definition.label, cwd);
  terminal.show(true);
  terminal.sendText(command, true);
}

function getWorkspaceFolder(): vscode.WorkspaceFolder | undefined {
  const activeUri = vscode.window.activeTextEditor?.document.uri;
  return activeUri ? vscode.workspace.getWorkspaceFolder(activeUri) : vscode.workspace.workspaceFolders?.[0];
}

function resolveVariables(value: string | undefined, folder: vscode.WorkspaceFolder | undefined): string | undefined {
  if (!value) {
    return value;
  }
  return value.replaceAll('${workspaceFolder}', folder?.uri.fsPath ?? '');
}

function getTerminal(label: string, cwd: string | undefined): vscode.Terminal {
  if (shouldReuseTerminal()) {
    sharedTerminal ??= vscode.window.createTerminal({ name: 'Makefile Target Launcher', cwd });
    return sharedTerminal;
  }

  return vscode.window.createTerminal({ name: `Makefile Target Launcher: ${label}`, cwd });
}

function shouldReuseTerminal(): boolean {
  return vscode.workspace.getConfiguration('makefile-target-launcher').get<boolean>('reuseTerminal', true);
}
