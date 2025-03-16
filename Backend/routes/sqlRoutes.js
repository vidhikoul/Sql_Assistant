const express = require("express");
const router = express.Router();

// Existing route for SQL query generation
router.post("/generate", (req, res) => {
  // Your existing SQL generation logic here...
  res.json({ generatedSQL: "SELECT * FROM ..." });
});

// New route for schema suggestions
router.post("/schema", (req, res) => {
  const { attributes, dependencies } = req.body;

  // Generate a schema suggestion using the attributes with datatypes and dependencies
  const schemaSuggestion = generateSchema(attributes, dependencies);

  res.json({ schema: schemaSuggestion });
});

/**
 * Generate a suggested schema.
 * @param {Array} attributes - Array of attribute strings in format "name:datatype"
 * @param {Array} dependencies - Array of dependency strings, e.g., "id->name"
 */
function generateSchema(attributes, dependencies) {
  // Parse each attribute into "name DATATYPE" format
  const parsedAttributes = attributes.map(attr => {
    const [name, type] = attr.split(":").map(part => part.trim());
    // Optionally, you can add logic to convert shorthand datatypes to full SQL datatypes
    return `${name.toUpperCase()} ${type.toUpperCase()}`;
  });

  // Construct the CREATE TABLE statement suggestion
  const schemaLines = [];
  schemaLines.push("CREATE TABLE Suggested_Table (");
  schemaLines.push("  " + parsedAttributes.join(",\n  "));
  schemaLines.push(");");

  // Append dependencies as comments if provided
  if (dependencies.length > 0) {
    schemaLines.push("\n-- Dependencies:");
    dependencies.forEach(dep => {
      schemaLines.push(`-- ${dep}`);
    });
  }

  return schemaLines.join("\n");
}

module.exports = router;
