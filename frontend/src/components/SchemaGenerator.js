import React, { useState, useRef } from "react";
import { 
  Container, 
  Card, 
  Form, 
  Button, 
  Toast, 
  Spinner, 
  Row, 
  Col, 
  ListGroup, 
  Overlay, 
  Tooltip,
  Navbar
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import SchemaDisplay from "./SchemaDisplay";
import { parseSQLSchema } from "./parseSQLSchema.js";
import { prismaToMermaid } from "./convertToMermaid.js";
import ERDiagram from "./ERDiagram";
import { FaCopy, FaRobot, FaUser, FaDatabase, FaArrowLeft } from "react-icons/fa";

const SchemaGenerator = () => {
  const [schemaPrompt, setSchemaPrompt] = useState("");
  const [generatedSchema, setGeneratedSchema] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prismaSchema, setPrismaSchema] = useState("");
  const [conversation, setConversation] = useState([]);
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("");
  const copyButtonRef = useRef(null);
  const navigate = useNavigate();
  const [erDiagram, setErDiagram] = useState("");

  const handleGenerateSchema = async () => {
    if (!schemaPrompt.trim()) {
      setToastMessage("Please enter a schema description");
      setShowToast(true);
      return;
    }

    // Add user message to conversation
    setConversation(prev => [
      ...prev,
      { sender: "user", content: schemaPrompt }
    ]);

    setLoading(true);
    try {
      const schemaResponse = await fetch(
        `http://localhost:5001/api/sql/schema?userQuery=${encodeURIComponent(schemaPrompt)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!schemaResponse.ok) {
        throw new Error(`Schema API Error: ${schemaResponse.statusText}`);
      }

      const schemaResult = await schemaResponse.json();

      if (!schemaResult.schema) {
        throw new Error("No schema returned from API");
      }

      setGeneratedSchema(schemaResult.schema);
      setToastMessage("Schema generated successfully!");

      // Add bot response to conversation
      setConversation(prev => [
        ...prev,
        { 
          sender: "bot", 
          content: "Here's the recommended schema:",
          schema: schemaResult.schema 
        }
      ]);

      const prismaResponse = await fetch(
        "http://localhost:5001/api/convert-to-prisma",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sqlSchema: schemaResult.schema.trim() }),
        }
      );

      if (!prismaResponse.ok) {
        const errorData = await prismaResponse.json();
        throw new Error(
          errorData.error || `Prisma conversion failed: ${prismaResponse.statusText}`
        );
      }

      const prismaResult = await prismaResponse.json();

      if (!prismaResult.prismaSchema) {
        throw new Error("No Prisma schema returned from conversion");
      }

      setPrismaSchema(prismaResult.prismaSchema);
      
      try {
        const mermaidCode = prismaToMermaid(prismaResult.prismaSchema);
        setErDiagram(mermaidCode);
      } catch (mermaidError) {
        console.error("Mermaid conversion error:", mermaidError);
        setToastMessage("Schema generated but diagram failed");
      }

    } catch (error) {
      console.error("Error in schema generation:", error);
      setGeneratedSchema(error.message);
      setPrismaSchema(`Error: ${error.message}`);
      setToastMessage(error.message);
      setShowToast(true);
      
      // Add error to conversation
      setConversation(prev => [
        ...prev,
        { sender: "bot", content: `Error: ${error.message}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setShowCopyTooltip(true);
    setTimeout(() => setShowCopyTooltip(false), 2000);
  };

  return (
    <Container fluid className="p-4 bg-light" style={{ minHeight: "100vh" }}>
      <Row className="mb-4">
        <Col>
          <h3>SCHEMA GENERATOR</h3>
        </Col>
      </Row>
      <Navbar bg="dark" variant="dark" className="mb-4 p-3">
        <Container className="d-flex justify-content-between align-items-center">
          <Navbar.Brand className="fs-3 fw-bold">SQL Assistant</Navbar.Brand>
          <div className="d-flex ms-auto gap-2">
            <Button
              variant="light"
              onClick={() => navigate('/SQLGenerator')}
              disabled={loading}
            >
              <FaArrowLeft className="me-2" />
              Back to SQL Assistant
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowModal(true)}
              disabled={loading}
            >
              <FaDatabase className="me-2" />
              Connect Database
            </Button>
          </div>
        </Container>
      </Navbar>
      <br />

      <Row className="g-4">
        {/* Left Column - Chat Interface */}
        <Col md={6}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <Card.Title>Schema Recommendation</Card.Title>
              
              {/* Chat Interface */}
              <div style={{ 
                height: "300px", 
                overflowY: "auto", 
                marginBottom: "15px",
                border: "1px solid #eee",
                borderRadius: "8px",
                padding: "10px"
              }}>
                {conversation.length === 0 ? (
                  <div className="text-muted text-center py-4">
                    Start a conversation about your schema needs
                  </div>
                ) : (
                  <ListGroup variant="flush">
                    {conversation.map((msg, index) => (
                      <ListGroup.Item 
                        key={index} 
                        className={`d-flex ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                        style={{ border: 'none', background: 'transparent' }}
                      >
                        <div 
                          className={`p-3 rounded ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-light'}`}
                          style={{ maxWidth: '80%' }}
                        >
                          <div className="d-flex align-items-center mb-1">
                            {msg.sender === 'user' ? (
                              <FaUser className="me-2" />
                            ) : (
                              <FaRobot className="me-2" />
                            )}
                            <strong>
                              {msg.sender === 'user' ? 'You' : 'Schema Assistant'}
                            </strong>
                          </div>
                          {msg.content}
                          
                          {msg.schema && (
                            <div className="mt-2">
                              <pre className="bg-white p-2 rounded" style={{ fontSize: '0.8rem' }}>
                                {msg.schema}
                              </pre>
                              <Button 
                                ref={copyButtonRef}
                                variant="outline-secondary" 
                                size="sm" 
                                onClick={() => copyToClipboard(msg.schema)}
                                className="mt-2"
                              >
                                <FaCopy className="me-1" /> Copy SQL
                              </Button>
                              <Overlay
                                target={copyButtonRef.current}
                                show={showCopyTooltip}
                                placement="right"
                              >
                                {(props) => (
                                  <Tooltip id="copy-tooltip" {...props}>
                                    Copied!
                                  </Tooltip>
                                )}
                              </Overlay>
                            </div>
                          )}
                        </div>
                      </ListGroup.Item>
                    ))}
                    {loading && (
                      <ListGroup.Item className="d-flex justify-content-start">
                        <div className="p-3 rounded bg-light">
                          <Spinner animation="border" size="sm" className="me-2" />
                          Generating schema...
                        </div>
                      </ListGroup.Item>
                    )}
                  </ListGroup>
                )}
              </div>

              <Form.Control
                as="textarea"
                rows={3}
                value={schemaPrompt}
                onChange={(e) => setSchemaPrompt(e.target.value)}
                placeholder="Describe your database schema needs..."
                className="mb-3"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerateSchema();
                  }
                }}
              />
              <Button 
                onClick={handleGenerateSchema} 
                disabled={loading}
                className="w-100"
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Generating...
                  </>
                ) : (
                  'Generate Schema'
                )}
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column - Schema Display and ER Diagram */}
        <Col md={6}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <Card.Title>Schema Visualization</Card.Title>
              <div style={{ height: "300px", overflowY: "auto" }} className="mb-3">
                <SchemaDisplay schema={parseSQLSchema(generatedSchema)} />
              </div>

              <Card className="mt-3">
                <Card.Header>ER Diagram</Card.Header>
                <Card.Body style={{ minHeight: "300px" }}>
                  {erDiagram ? (
                    <ERDiagram diagramCode={erDiagram} />
                  ) : (
                    <div className="text-muted d-flex align-items-center justify-content-center h-100">
                      No diagram generated yet
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* Display Prisma Schema */}
              {prismaSchema && (
                <Card className="mt-3">
                  <Card.Header>Prisma Schema</Card.Header>
                  <Card.Body>
                    <pre style={{ fontSize: '0.8rem' }}>{prismaSchema}</pre>
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      onClick={() => copyToClipboard(prismaSchema)}
                    >
                      <FaCopy className="me-1" /> Copy Prisma Schema
                    </Button>
                  </Card.Body>
                </Card>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Toast Notifications */}
      <Toast 
        show={showToast} 
        onClose={() => setShowToast(false)} 
        autohide 
        delay={3000}
        style={{ position: "fixed", top: 20, right: 20 }}
      >
        <Toast.Body>{toastMessage}</Toast.Body>
      </Toast>
    </Container>
  );
};

export default SchemaGenerator;