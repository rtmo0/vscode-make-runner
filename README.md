# Make Runner

<img src="media/icon.png" alt="Make Runner icon" width="128" align="right" />

Make Runner is a small VS Code extension for keeping frequently used workspace commands in one place and launching them in the integrated terminal. It also adds a clickable **Run** action next to every Makefile target.

## Configuration

Add commands to workspace or user settings:

```json
{
  "make-runner.commands": [
    {
      "label": "Start development server",
      "command": "npm run dev",
      "description": "Runs the local development server"
    },
    {
      "label": "Run API tests",
      "command": "npm test",
      "cwd": "${workspaceFolder}/api"
    }
  ]
}
```

Each command supports:

- `label` — the name shown in Make Runner.
- `command` — the shell command to run.
- `cwd` — an optional working directory; defaults to the workspace folder.
- `description` — optional text shown next to the command.

`${workspaceFolder}` can be used in `command` and `cwd`. By default, commands share one terminal. Disable `make-runner.reuseTerminal` to create a separate terminal for every run.

## Usage

Run a command from the **Command Palette** (**Make Runner: Run Command…**) or by clicking the **Make Runner** entry in the status bar. Use **Make Runner: Configure Commands** to open the settings.

In any `Makefile`, a green **Run** action appears next to every target — click it to execute `make <target>` in the integrated terminal.

## Development

```bash
npm install
npm run check
npm run build
```

Press `F5` to open an Extension Development Host. See [PUBLISHING.md](PUBLISHING.md) for release instructions.
