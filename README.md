# Makefile Target Launcher

[![Support on Boosty](https://img.shields.io/badge/Boosty-support-F15F2C?logo=boosty&logoColor=white)](https://boosty.to/rtm00)

<img src="media/icon.png" alt="Makefile Target Launcher icon" width="128" align="right" />

Makefile Target Launcher is a small VS Code extension for keeping frequently used workspace commands in one place and launching them in the integrated terminal. It also adds a clickable **Run** action next to every Makefile target.

## Configuration

Add commands to workspace or user settings:

```json
{
  "makefile-target-launcher.commands": [
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

- `label` — the name shown in Makefile Target Launcher.
- `command` — the shell command to run.
- `cwd` — an optional working directory; defaults to the workspace folder.
- `description` — optional text shown next to the command.

`${workspaceFolder}` can be used in `command` and `cwd`. By default, commands share one terminal. Disable `makefile-target-launcher.reuseTerminal` to create a separate terminal for every run.

## Usage

Run a command from the **Command Palette** (**Makefile Target Launcher: Run Command…**) or by clicking the **Makefile Target Launcher** entry in the status bar. Use **Makefile Target Launcher: Configure Commands** to open the settings.

In any `Makefile`, a green **Run** action appears next to every target — click it to execute `make <target>` in the integrated terminal.

## Support

Makefile Target Launcher is free and open source. If it saves you time, you can support its development on [Boosty](https://boosty.to/rtm00). Bug reports and pull requests are just as welcome.

## Development

```bash
npm install
npm run check
npm run build
```

Press `F5` to open an Extension Development Host. See [PUBLISHING.md](PUBLISHING.md) for release instructions.
