import React from "react";
import { parseSQLSchema } from "./parseSQLSchema";

const SchemaDisplay = ({ schema = '' }) => {
  return (
    <div>
      {
        
        schema.length === 0 ? (
          <p>No schema available</p>
        ) : 
      schema.map((table) => (
        
        <div key={table.tableName} className="p-4 border-b">
          <h2 className="text-xl font-bold mb-2">{table.tableName}</h2>
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-4 py-2">Column Name</th>
                <th className="border px-4 py-2">Type</th>
                <th className="border px-4 py-2">Constraints</th>
              </tr>
            </thead>
            <tbody>
              {table.columns.map((col) => (
                <tr key={col.name}>
                  <td className="border px-4 py-2">{col.name}</td>
                  <td className="border px-4 py-2">{col.type}</td>
                  <td className="border px-4 py-2">{col.constraints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default SchemaDisplay;
