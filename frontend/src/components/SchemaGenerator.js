import React, { useState } from "react";
import { Container, Card, Form, Button, Toast } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import SchemaDisplay from "./SchemaDisplay";
import { parseSQLSchema } from "./parseSQLSchema.js";

const SchemaGenerator = () => {
  const [schemaPrompt, setSchemaPrompt] = useState("");
  const [generatedSchema, setGeneratedSchema] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const navigate = useNavigate();

  const handleGenerateSchema = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/sql/schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userQuery: schemaPrompt }),
      });

      const result = await response.json();

      if (result.schema) {
        setGeneratedSchema(result.schema);
        setToastMessage("Schema generated successfully!");
      } else {
        setGeneratedSchema("Error generating schema.");
        setToastMessage("Error generating schema!");
      }
      setShowToast(true);
    } catch (error) {
      console.error(error);
      setGeneratedSchema("Error generating schema.");
      setToastMessage("Error generating schema!");
      setShowToast(true);
    }
  };

  return (
    <Container className="vh-100 p-4 bg-light">
      <div style={{ display: "flex", gap: "10px" }}>
      <Card className="p-5 shadow-sm">
        <h5>Get Schema Recommendation</h5>
        <Form.Control
          as="textarea"
          rows={5}
          value={schemaPrompt}
          onChange={(e) => setSchemaPrompt(e.target.value)}
          placeholder="Enter your Prompt..."
        />
        <Button className="mt-2" onClick={handleGenerateSchema}>
          Create Schema
        </Button>
        <div className="mt-3 p-2 bg-white border rounded" style={{ minHeight: "100px" }}>
          {generatedSchema}
        </div>
      </Card>
      <card className="mt-3 p-2 bg-white border rounded" style={{ minHeight: "100px"}}>
      <SchemaDisplay schema={parseSQLSchema(generatedSchema)} />
      </card>

      </div>
      <div className="mt-4 d-flex justify-content-between">
        <Button variant="secondary" onClick={() => navigate("/")}>
          Back to SQL Assistant
        </Button>
        <Button variant="primary" onClick={() => navigate("/connect-database")}>
          Connect to Database
        </Button>
      </div>

      {/* Toast Notifications */}
      <Toast show={showToast} onClose={() => setShowToast(false)} autohide delay={3000}>
        <Toast.Body>{toastMessage}</Toast.Body>
      </Toast>
    </Container>
  );
};

export default SchemaGenerator;
