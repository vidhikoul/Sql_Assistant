import React, { useState } from 'react';
import { Card, Button, Spinner, Collapse, Alert } from 'react-bootstrap';

const QueryExplanation = ({ sqlQuery }) => {
  // Define all state variables and setters at the top
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const explainQuery = async () => {
    if (!sqlQuery?.trim()) {
      setError('Please enter a SQL query first');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5001/api/sql/explain', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          sqlQuery: sqlQuery.trim() 
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.explanation) {
        throw new Error('No explanation received from server');
      }

      setExplanation(data.explanation);
      setIsOpen(true);
    } catch (err) {
      console.error('Explanation error:', err);
      setError(err.message || 'Failed to get explanation');
      setExplanation('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={explainQuery}
            disabled={loading || !sqlQuery?.trim()}
            className="me-2"
          >
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Explaining...
              </>
            ) : (
              'Explain Query'
            )}
          </Button>
          <Button
            variant="link"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            disabled={!explanation && !error}
          >
            {isOpen ? 'Hide' : 'Show'} Explanation
          </Button>
        </div>
      </Card.Header>

      <Collapse in={isOpen}>
        <Card.Body>
          {error ? (
            <Alert variant="danger" className="mb-0">
              {error}
              <div className="mt-2">
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={explainQuery}
                >
                  Try Again
                </Button>
              </div>
            </Alert>
          ) : explanation ? (
            <div className="sql-explanation">
              {explanation.split('\n').map((para, i) => (
                <p key={i} className="mb-2">{para}</p>
              ))}
            </div>
          ) : (
            <p className="text-muted mb-0">
              {sqlQuery?.trim() ? 'Explanation will appear here' : 'Enter a SQL query to explain'}
            </p>
          )}
        </Card.Body>
      </Collapse>
    </Card>
  );
};

export default QueryExplanation;