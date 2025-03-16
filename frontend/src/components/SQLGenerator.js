import React, { useState } from "react";
import axios from "axios";
import { Container, Row, Col, Card, Form, Button, Spinner, Navbar } from "react-bootstrap";
import { Copy, Database } from "react-bootstrap-icons";
import Editor from "@monaco-editor/react";

const SQLAssistant = () => {
  const [userQuery, setUserQuery] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [schema, setSchema] = useState("Enter prompt...");
  const [generatedSQL, setGeneratedSQL] = useState("");
  const [loading, setLoading] = useState(false);

  const generateSQL = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5001/api/sql/generate", { userQuery });
      setGeneratedSQL(res.data.generatedSQL);
    } catch (error) {
      console.error(error);
      setGeneratedSQL("Error generating SQL. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChatQuery = async () => {
    try {
      const res = await axios.post("http://localhost:5001/api/chatbot", { userQuery });
      setChatResponse(res.data.response);
    } catch (error) {
      console.error(error);
      setChatResponse("UPDATE student SET result_statur = 'DISTINCTION' WHERE (mid_term + final_exam) > 125");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedSQL);
  };

  return (
    <Container fluid className="vh-100 p-4 bg-light">
      {/* Navbar with Project Title and Database Connection Button */}
      <Navbar bg="dark" variant="dark" className="mb-4 p-3">
        <Container className="d-flex justify-content-between align-items-center">
          <Navbar.Brand className="fs-3 fw-bold">SQL Assistant</Navbar.Brand>
          <Button variant="success">
            <Database className="me-2" /> Connect to Database
          </Button>
        </Container>
      </Navbar>

      <Row className="h-100">
        {/* Left Panel: Chatbot & Schema Section */}
        <Col md={4} className="d-flex flex-column">
          <Card className="p-3 shadow-sm mb-3">
            <h5>Get Schema Recommendation</h5>
            <div className="bg-white p-2 border rounded" style={{ minHeight: "100px" }}>{schema}</div>
            <Button className="mt-2">Create Schema</Button>
          </Card>

          <Card className="p-3 shadow-sm flex-grow-1">
            <h5>Get SQL Query</h5>
            <Form.Control
              as="textarea"
              rows={3}
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Enter Prompt Here..."
            />
            <Button className="mt-2" onClick={handleChatQuery}>Get Answer</Button>
            <div className="mt-3 p-2 bg-white border rounded" style={{ minHeight: "100px" }}>{chatResponse}</div>
            <Button variant="outline-primary" className="mt-2" onClick={copyToClipboard}>
              <Copy className="me-2" /> Copy SQL
            </Button>
          </Card>
        </Col>

        {/* Right Panel: SQL Editor & Connectivity */}
        <Col md={8} className="d-flex flex-column">
          <Card className="p-3 shadow-sm flex-grow-1">
            <h5>SQL Editor</h5>
            <Editor
              height="300px"
              defaultLanguage="sql"
              defaultValue="-- Write your SQL query here"
              onChange={(value) => setUserQuery(value)}
            />
            <Button className="mt-2 w-100" onClick={generateSQL} disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" className="me-2" /> : "Execute Query"}
            </Button>
          </Card>

          <Card className="p-3 mt-3 shadow-sm">
            <h5> Result:</h5>
            <pre className="bg-white p-3 border rounded">{generatedSQL}</pre>
           
          </Card>
        </Col>
      </Row>
    </Container>
  );
}; 

export default SQLAssistant;
