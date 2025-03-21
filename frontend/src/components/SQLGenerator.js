import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Navbar, Modal, Toast } from 'react-bootstrap';
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

  const [showModal, setShowModal] = useState(false);
  const [dbUrl, setDbUrl] = useState('');
  const [dbUser, setDbUser] = useState('');
  const [dbPassword, setDbPassword] = useState('');
  const [dbName, setDbName] = useState('');
  const [dbConnectionError, setDbConnectionError] = useState(null); // New state for connection errors

  const [schemaPrompt, setSchemaAttributes] = useState('');
  const [generatedSchema, setGeneratedSchema] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const [connectionStatus, setConnectionStatus] = useState('');  // New state for connection status

  useEffect(() => {
    if (window.monaco) {
      window.monaco.languages.registerCompletionItemProvider('sql', {
        provideCompletionItems: (model, position) => {
          const word = model.getWordAtPosition(position);
          const suggestions = [
            'SELECT', 'WHERE', 'UPDATE', 'INSERT', 'DELETE', 'FROM', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'ORDER BY', 'GROUP BY', 'LIMIT',
            'HAVING', 'LIKE', 'IN', 'AND', 'OR', 'NOT', 'AS', 'IS', 'BETWEEN', 'DISTINCT', 'NULL'
          ].map(keyword => ({
            label: keyword,
            kind: window.monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column - (word ? word.word.length : 0),
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            }
          }));
          return { suggestions };
        },
      });
    }
  }, []);

  const generateSQL = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5001/api/sql/generate', {userQuery: userQuery});
      setGeneratedSQL(res.data.generatedSQL);
      setToastMessage('SQL generated successfully!');
      setShowToast(true);
    } catch (error) {
      console.error(error);
      setGeneratedSQL('Error generating SQL. Please try again.');
      setToastMessage('Error generating SQL!');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectDatabase = async () => {
    if (!dbUrl || !dbUser || !dbPassword || !dbName) {
      setDbConnectionError('Please fill all fields to connect.');
      return;
    }

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
        setToastMessage('Connected to the database successfully!');
        setShowToast(true);
        setConnectionStatus(dbName); // Set the button text to database name
      } else {
        setDbConnectionError('Failed to connect to the database!');
        setConnectionStatus('Connect to Database'); // Reset the button text
      }
    } catch (error) {
      console.error('Error connecting to the database:', error);
      setDbConnectionError('Error connecting to the database!');
      setConnectionStatus('Connect to Database'); // Reset the button text
    }
  };

  const executeQuery = async () => {
    setLoading(true);
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
        setQueryResult(result.data);
        setToastMessage('Query executed successfully!');
        setShowToast(true);
      } else {
        setToastMessage('Error executing the query!');
        setShowToast(true);
      }
    } catch (error) {
      console.error(error);
      setToastMessage('Error executing the query!');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSchema = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/sql/schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userQuery: schemaPrompt }),
      });

      const result = await response.json();

      if (result.schema) {
        setGeneratedSchema(result.schema);
        setToastMessage('Schema generated successfully!');
        setShowToast(true);
      } else {
        setGeneratedSchema('Error generating schema.');
        setToastMessage('Error generating schema!');
        setShowToast(true);
      }
    } catch (error) {
      console.error(error);
      setGeneratedSchema('Error generating schema.');
      setToastMessage('Error generating schema!');
      setShowToast(true);
    }
  };

  const copyToClipboard = (content) => {
    const textArea = document.createElement('textarea');
    textArea.value = content; // Set the value to the content (generatedSQL or chatResponse)
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    setToastMessage('Content copied to clipboard!');
    setShowToast(true);
  };

  return (
    <Container fluid className="vh-100 p-4 bg-light">
      <Navbar bg="dark" variant="dark" className="mb-4 p-3">
        <Container className="d-flex justify-content-between align-items-center">
          <Navbar.Brand className="fs-3 fw-bold">SQL Assistant</Navbar.Brand>
          <Button
            variant={connectionStatus === dbName ? 'primary' : 'success'}  // Change button color to blue if connected
            onClick={() => setShowModal(true)}
          >
            <Database className="me-2" />
            {connectionStatus || 'Connect to Database'}
          </Button>
        </Container>
      </Navbar>

      <Row className="h-100">
        <Col md={4} className="d-flex flex-column">
          <Card className="p-3 shadow-sm mb-3">
            <h5>Get Schema Recommendation</h5>
            
            <Form.Control
              as="textarea"
              rows={5}
              value={schemaPrompt}
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
            {
            ( queryResult == null)? <h3>No data found</h3>: (queryResult[0] === undefined) ? <h3>No data found</h3>:queryResult && (
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
                      )
                      )}
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
            {dbConnectionError && <div className="text-danger">{dbConnectionError}</div>}
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

      {/* Toast Notifications */}
      <Toast show={showToast} onClose={() => setShowToast(false)} autohide delay={3000}>
        <Toast.Body>{toastMessage}</Toast.Body>
      </Toast>
    </Container>
  );
};

export default SQLAssistant;
