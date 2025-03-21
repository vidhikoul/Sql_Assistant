export const parseSQLSchema = (sql) => {
    const tableSchemas = [];
    sql += ";";
    // Match CREATE TABLE statements
    const tableMatches = [...sql.matchAll(/CREATE TABLE (\w+) \(([\s\S]+?)\);/g)];
  
    tableMatches.forEach((match) => {
      const tableName = match[1];
      const columnsString = match[2];
  
      const columns = [];
      const columnMatches = [...columnsString.matchAll(/(\w+)\s+([\w()]+)([^,]*)/g)];
  
      columnMatches.forEach((colMatch) => {
        const columnName = colMatch[1];
        const columnType = colMatch[2];
        const constraints = colMatch[3].trim(); // e.g., PRIMARY KEY, NOT NULL
  
        columns.push({
          name: columnName,
          type: columnType,
          constraints: constraints || "None",
        });
      });
  
      tableSchemas.push({
        tableName,
        columns,
      });
    });
    return tableSchemas;
  };
  