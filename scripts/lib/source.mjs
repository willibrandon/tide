import { parse } from '@babel/parser';

export function walkSyntax(node, visit) {
  if (!node || typeof node.type !== 'string') return;
  visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const child of value) walkSyntax(child, visit);
    } else if (value && typeof value === 'object') {
      walkSyntax(value, visit);
    }
  }
}

export function extractColorRegistrations(source, path) {
  const syntax = parse(source, {
    sourceFilename: path,
    sourceType: 'module',
    plugins: ['typescript', 'decorators-legacy'],
  });
  const colors = {};
  walkSyntax(syntax, (node) => {
    if (node.type !== 'CallExpression') return;
    const callee = node.callee;
    const name =
      callee.type === 'Identifier'
        ? callee.name
        : callee.type === 'MemberExpression' && !callee.computed
          ? callee.property.name
          : undefined;
    if (name !== 'registerColor') return;
    const [id, , description, transparency, deprecation] = node.arguments;
    const key =
      id?.type === 'StringLiteral'
        ? id.value
        : id?.type === 'TemplateLiteral' && id.expressions.length === 0
          ? id.quasis[0].value.cooked
          : undefined;
    if (typeof key !== 'string') return;
    colors[key] = {
      source: path,
      description: description ? source.slice(description.start, description.end) : '',
      requiresTransparency: transparency?.type === 'BooleanLiteral' && transparency.value === true,
      ...(deprecation
        ? { deprecationMessage: source.slice(deprecation.start, deprecation.end) }
        : {}),
    };
  });
  return colors;
}
