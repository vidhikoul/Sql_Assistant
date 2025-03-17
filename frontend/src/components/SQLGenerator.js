import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Navbar, Modal } from 'react-bootstrap';
import { Copy, Database } from 'react-bootstrap-icons';
import Editor from '@monaco-editor/react';
import axios from 'axios';

const SQLAssistant = () => {
  const [userQuery, setUserQuery] = useState('');
  const [editorQuery, setEditorQuery] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [generatedSQL, setGeneratedSQL] = useState('');
  const [loading, setLoading] = useState(false);
  const [queryResult, setQueryResult] = useState(null);  // State to store query results

  // New state for database connection
  const [showModal, setShowModal] = useState(false);
  const [dbUrl, setDbUrl] = useState('');
  const [dbUser, setDbUser] = useState('');
  const [dbPassword, setDbPassword] = useState('');
  const [dbName, setDbName] = useState('');

  // New state for schema generation
  const [schemaAttributes, setSchemaAttributes] = useState('');
  const [generatedSchema, setGeneratedSchema] = useState('');

  const generateSQL = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5001/api/sql/generate', {userQuery: userQuery });
      console.log(res.data.generatedSQL);
      setGeneratedSQL(res.data.generatedSQL);
    } catch (error) {
      console.error(error);
      setGeneratedSQL('Error generating SQL. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle connecting to the database
  const handleConnectDatabase = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/sql/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dbHost: dbUrl,
          dbUser,
          dbPassword,
          dbName,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShowModal(false);
        alert('Connected to the database successfully!');
      } else {
        alert('Failed to connect to the database!');
      }
    } catch (error) {
      console.error('Error connecting to the database:', error);
      alert('Error connecting to the database!');
    }
  };

  // Execute SQL query in the connected database
  const executeQuery = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/sql/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: editorQuery,
          dbHost: dbUrl,
          dbUser,
          dbPassword,
          dbName,
        }),
      });

      const result = await response.json();


      if (result.success) {
        
        setQueryResult(result.data);  // Store the query result here
      } else {
        alert('Error executing the query.');
      }
    } catch (error) {
      console.error(error);
      alert('Error executing the query.');
    }
  };

  // Handle Schema generation request
  const handleGenerateSchema = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/sql/schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attributes: schemaAttributes.split('\n') }),
      });

      const result = await response.json();

      if (result.schema) {
        setGeneratedSchema(result.schema);
      } else {
        setGeneratedSchema('Error generating schema.');
      }
    } catch (error) {
      console.error(error);
      setGeneratedSchema('Error generating schema.');
    }
  };

  // Copy the content of either generatedSQL or chatResponse to the clipboard
  const copyToClipboard = (content) => {
    const textArea = document.createElement('textarea');
    textArea.value = content; // Set the value to the content (generatedSQL or chatResponse)
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    console.log('Content copied to clipboard!');
  };

  return (
    <Container fluid className="vh-100 p-4 bg-light">
      {/* Navbar with Project Title and Database Connection Button */}
      <Navbar bg="dark" variant="dark" className="mb-4 p-3">
        <Container className="d-flex justify-content-between align-items-center">
          <Navbar.Brand className="fs-3 fw-bold">SQL Assistant</Navbar.Brand>
          <Button variant="success" onClick={() => setShowModal(true)}>
            <Database className="me-2" /> Connect to Database
          </Button>
        </Container>
      </Navbar>

      <Row className="h-100">
        {/* Left Panel: Chatbot & Schema Section */}
        <Col md={4} className="d-flex flex-column">
          <Card className="p-3 shadow-sm mb-3">
            <h5>Get Schema Recommendation</h5>
            <Form.Control
              as="textarea"
              rows={5}
              value={schemaAttributes}
              onChange={(e) => setSchemaAttributes(e.target.value)}
              placeholder="Enter your Prompt..."
            />
            <Button className="mt-2" onClick={handleGenerateSchema}>Create Schema</Button>
            <div className="mt-3 p-2 bg-white border rounded" style={{ minHeight: '100px' }}>
              {generatedSchema}
            </div>
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
            
            <Button className="mt-2" onClick={generateSQL}>Generate Query</Button>
            <div className="mt-3 p-2 bg-white border rounded" style={{ minHeight: '100px' }}>
              {generatedSQL}
            </div>
            <Button variant="outline-primary" className="mt-2" onClick={() => copyToClipboard(generatedSQL)}>
              <Copy className="me-2" /> Copy SQL
            </Button>
          </Card>
        </Col>

        {/* Right Panel: SQL Editor & Connectivity */}
        <Col md={8} className="d-flex flex-column">
          <Card className="p-3 shadow-sm flex-grow-1">
            <h5>SQL Editor</h5>
            <Editor
              height="450px"
              defaultLanguage="sql"
              value={editorQuery}
              onChange={(value) => setEditorQuery(value)}
              defaultValue="-- Write your SQL query here"
            />
            <Button className="mt-5 w-100" onClick={executeQuery} disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" className="me-2" /> : 'Execute Query'}
            </Button>
          </Card>

          <Card className="p-3 mt-3 shadow-sm">
            <h5>Result:</h5>
            {queryResult && (
              <table className="table table-bordered">
                <thead>
                  <tr>
                    {Object.keys(queryResult[0]).map((key) => (
                      <th key={key}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {queryResult.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, idx) => (
                        <td key={idx}>{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {/* <Button variant="outline-primary" className="mt-2" onClick={() => copyToClipboard(generatedSQL)}>
              <Copy className="me-2" /> Copy Result
            </Button> */}
          </Card>
        </Col>
      </Row>

      {/* Modal for Database Connection */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Connect to Database</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="dbUrl">
              <Form.Label>Database URL</Form.Label>
              <Form.Control
                type="text"
                value={dbUrl}
                onChange={(e) => setDbUrl(e.target.value)}
                placeholder="Enter database URL"
              />
            </Form.Group>
            <Form.Group controlId="dbUser">
              <Form.Label>Database User</Form.Label>
              <Form.Control
                type="text"
                value={dbUser}
                onChange={(e) => setDbUser(e.target.value)}
                placeholder="Enter database user"
              />
            </Form.Group>
            <Form.Group controlId="dbPassword">
              <Form.Label>Database Password</Form.Label>
              <Form.Control
                type="password"
                value={dbPassword}
                onChange={(e) => setDbPassword(e.target.value)}
                placeholder="Enter database password"
              />
            </Form.Group>
            <Form.Group controlId="dbName">
              <Form.Label>Database Name</Form.Label>
              <Form.Control
                type="text"
                value={dbName}
                onChange={(e) => setDbName(e.target.value)}
                placeholder="Enter database name"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleConnectDatabase}>
            Connect
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SQLAssistant;
