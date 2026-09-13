const vscode = require('vscode');

exports.activate = async (context) => {
  const folder = vscode.workspace.workspaceFolders[0].uri;
  const file = (name) => vscode.Uri.joinPath(folder, name);
  const diagnostics = vscode.languages.createDiagnosticCollection('Tide preview');
  context.subscriptions.push(diagnostics);
  const legend = new vscode.SemanticTokensLegend([
    'namespace',
    'class',
    'variable',
    'property',
    'function',
    'string',
    'number',
    'keyword',
    'comment',
  ]);
  context.subscriptions.push(
    vscode.languages.registerDocumentSemanticTokensProvider(
      { language: 'tide-preview' },
      {
        provideDocumentSemanticTokens(document) {
          const builder = new vscode.SemanticTokensBuilder(legend);
          for (
            let line = 0;
            line < Math.min(document.lineCount, legend.tokenTypes.length);
            line++
          ) {
            builder.push(
              new vscode.Range(line, 0, line, document.lineAt(line).text.length),
              legend.tokenTypes[line],
            );
          }
          return builder.build();
        },
      },
      legend,
    ),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('tide.preview.semanticFixture', async () => {
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');
      await vscode.window.showTextDocument(
        await vscode.workspace.openTextDocument(file('semantic.tide')),
        { preview: false },
      );
    }),
  );
  const openSource = async () => {
    diagnostics.clear();
    await vscode.commands.executeCommand('workbench.action.closePanel');
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(file('tide.ts')), {
      preview: false,
    });
    await vscode.commands.executeCommand('workbench.view.explorer');
  };
  for (const variant of ['dark', 'light'])
    context.subscriptions.push(
      vscode.commands.registerCommand(`tide.preview.${variant}`, async () => {
        await vscode.workspace
          .getConfiguration('workbench')
          .update('colorTheme', `tide-${variant}`, vscode.ConfigurationTarget.Workspace);
        await openSource();
      }),
    );
  for (const inline of [false, true])
    context.subscriptions.push(
      vscode.commands.registerCommand(
        `tide.preview.${inline ? 'inlineDiff' : 'diff'}`,
        async () => {
          await vscode.workspace
            .getConfiguration('diffEditor')
            .update('renderSideBySide', !inline, vscode.ConfigurationTarget.Workspace);
          await vscode.commands.executeCommand('workbench.action.closeAllEditors');
          await vscode.commands.executeCommand(
            'vscode.diff',
            file('diff/before.ts'),
            file('diff/after.ts'),
            'Observation · before ↔ after',
          );
        },
      ),
    );
  for (const enabled of [true, false])
    context.subscriptions.push(
      vscode.commands.registerCommand(
        `tide.preview.semantic${enabled ? 'On' : 'Off'}`,
        async () => {
          await vscode.workspace
            .getConfiguration('editor')
            .update('semanticHighlighting.enabled', enabled, vscode.ConfigurationTarget.Workspace);
        },
      ),
    );
  context.subscriptions.push(
    vscode.commands.registerCommand('tide.preview.diagnostics', async () => {
      await openSource();
      diagnostics.set(file('tide.ts'), [
        new vscode.Diagnostic(
          new vscode.Range(35, 6, 35, 13),
          'Preview: a station name is required.',
          vscode.DiagnosticSeverity.Error,
        ),
        new vscode.Diagnostic(
          new vscode.Range(36, 15, 36, 19),
          'Preview: verify the observation timestamp.',
          vscode.DiagnosticSeverity.Warning,
        ),
        new vscode.Diagnostic(
          new vscode.Range(37, 0, 37, 7),
          'Preview: measurements use meters.',
          vscode.DiagnosticSeverity.Information,
        ),
      ]);
      await vscode.commands.executeCommand('workbench.actions.view.problems');
    }),
  );
  await openSource();
};
