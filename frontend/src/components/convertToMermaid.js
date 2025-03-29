export const prismaToMermaid = (prismaSchema) => {
  if (!prismaSchema) return 'erDiagram\n    // No Prisma schema provided';

  try {
    const models = [];
    const relations = [];
    let currentModel = null;
    let currentFields = [];
    let enums = [];

    // First pass: Collect enum definitions
    prismaSchema.split('\n').forEach((line) => {
      line = line.trim();
      if (line.startsWith('enum ')) {
        const enumName = line.split(/\s+/)[1];
        enums.push(enumName);
      }
    });

    // Second pass: Process models
    prismaSchema.split('\n').forEach((line) => {
      line = line.trim();

      // Model definition
      if (line.startsWith('model ')) {
        if (currentModel) {
          models.push({
            name: currentModel,
            fields: [...currentFields],
          });
          currentFields = [];
        }
        currentModel = line.split(/\s+/)[1];
      }
      // Field definition
      else if (currentModel && line && !line.startsWith('//') && !line.startsWith('}')) {
        const fieldMatch = line.match(/^(\w+)\s+(\w+)(\??)\s*(@relation\(.*?\)|@default\(.*?\)|@map\(.*?\)|@unique|@id)*/);
        if (fieldMatch) {
          const [, name, type, optional, ...attrs] = fieldMatch; // Removed unused '_' variable
          const isRelation = attrs.some((attr) => attr?.startsWith('@relation'));
          const isEnum = enums.includes(type);

          if (!isRelation) {
            currentFields.push({
              name,
              type: isEnum ? `enum(${type})` : type,
              optional: optional === '?',
              isId: attrs.some((attr) => attr === '@id'),
              isForeignKey: attrs.some((attr) => attr?.startsWith('@relation')),
            });
          }

          // Process relations
          const relationAttr = attrs.find((attr) => attr?.startsWith('@relation'));
          if (relationAttr) {
            const relationMatch = relationAttr.match(/@relation\((.*?)\)/);
            if (relationMatch) {
              const relationParams = relationMatch[1];
              const refMatch = relationParams.match(/fields:\s*\[([^\]]+)\],\s*references:\s*\[([^\]]+)\]/);
              const nameMatch = relationParams.match(/name:\s*"([^"]+)"/);

              if (refMatch) {
                relations.push({
                  from: currentModel,
                  fromField: refMatch[1].trim(),
                  to: type.replace('?', ''),
                  toField: refMatch[2].trim(),
                  type: line.includes('[]') ? 'one-to-many' : 'one-to-one',
                  name: nameMatch ? nameMatch[1] : null,
                });
              }
            }
          }
        }
      }
    });

    // Add the last model
    if (currentModel) {
      models.push({
        name: currentModel,
        fields: [...currentFields],
      });
    }

    // Generate Mermaid ER diagram
    let mermaidCode = 'erDiagram\n\n';

    // Add models with fields
    models.forEach((model) => {
      mermaidCode += `    ${model.name} {\n`;

      // Add fields with types and constraints
      model.fields.forEach((field) => {
        let fieldDef = `${field.type}${field.optional ? '?' : ''} ${field.name}`;
        if (field.isId) fieldDef += ' PK';
        if (field.isForeignKey) fieldDef += ' FK';
        mermaidCode += `        ${fieldDef}\n`;
      });

      mermaidCode += `    }\n\n`;
    });

    // Add relations with proper cardinality
    relations.forEach((rel) => {
      let relationLine = `    ${rel.from} `;

      // Check if this is a junction table
      const isJunctionTable = models.some(
        (m) =>
          m.name === rel.from &&
          m.fields.length === 2 &&
          m.fields.every((f) => f.isForeignKey)
      );

      // Determine relationship type
      if (rel.type === 'one-to-many') {
        relationLine += '||--o{';
      } else if (rel.type === 'many-to-many') {
        if (isJunctionTable) {
          relationLine = `    ${rel.to} }o--o{ ${rel.from}`;
        } else {
          relationLine += '}o--o{';
        }
      } else {
        relationLine += '||--||';
      }

      // Add the target entity if not a junction table relationship
      if (!(rel.type === 'many-to-many' && isJunctionTable)) {
        relationLine += ` ${rel.to}`;
      }

      // Add relationship label
      if (rel.name) {
        relationLine += ` : "${rel.name}"`;
      } else {
        relationLine += ` : "${rel.fromField} → ${rel.toField}"`;
      }

      mermaidCode += relationLine + '\n';
    });

    return mermaidCode;
  } catch (error) {
    console.error('Error converting to Mermaid:', error);
    return `erDiagram\n    // Error generating diagram\n    // ${error.message}`;
  }
};