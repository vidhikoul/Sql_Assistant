import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

const ERDiagram = ({ diagramCode }) => {
  const diagramRef = useRef(null);
  const containerRef = useRef(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // SVG Icons
  const MaximizeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  );

  const MinimizeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
    </svg>
  );

  const DoubleArrowIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 10l5 5 5-5M7 14l5-5 5 5" />
    </svg>
  );

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      er: {
        diagramPadding: 20,
        layoutDirection: 'TB'
      }
    });
  }, []);

  // Render diagram when code changes
  useEffect(() => {
    const renderDiagram = async () => {
      if (!diagramCode || !diagramRef.current) return;

      try {
        diagramRef.current.innerHTML = '';
        setError(null);

        const id = 'er-diagram-' + Math.random().toString(36).slice(2, 11);
        const { svg } = await mermaid.render(id, diagramCode);
        setSvg(svg);
      } catch (err) {
        setError(`Rendering failed: ${err.message.split('\n')[0]}`);
      }
    };

    renderDiagram();
  }, [diagramCode]);

  // Apply zoom transform
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.transform = `scale(${scale})`;
      containerRef.current.style.transformOrigin = 'top left';
    }
  }, [scale]);

  const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 2));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
  const resetZoom = () => setScale(1);
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
      setScale(1.5);
    } else {
      document.exitFullscreen?.();
      setScale(1);
    }
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="er-diagram-container" style={{ 
      position: 'relative',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      <div className="zoom-controls" style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 10,
        display: 'flex',
        gap: '8px',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '8px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        alignItems: 'center'
      }}>
        <button 
          onClick={zoomOut}
          style={{
            padding: '6px 12px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer',
            background: '#f5f5f5',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Zoom Out"
        >
          <MinimizeIcon />
        </button>
        
        <span style={{ 
          minWidth: '50px', 
          textAlign: 'center',
          fontWeight: '500'
        }}>
          {Math.round(scale * 100)}%
        </span>
        
        <button 
          onClick={zoomIn}
          style={{
            padding: '6px 12px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer',
            background: '#f5f5f5',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Zoom In"
        >
          <MaximizeIcon />
        </button>
        
        <div style={{ width: '1px', height: '20px', background: '#ddd', margin: '0 4px' }} />
        
        <button 
          onClick={toggleFullscreen}
          style={{
            padding: '6px 12px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer',
            background: '#f5f5f5',
            display: 'flex',
            alignItems: 'center'
          }}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          <DoubleArrowIcon />
        </button>
      </div>

      {error && (
        <div style={{ 
          color: '#d32f2f',
          backgroundColor: '#fde8e8',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          <strong>Error:</strong> {error}
          <pre style={{ 
            whiteSpace: 'pre-wrap',
            marginTop: '8px',
            padding: '8px',
            backgroundColor: '#f1f1f1',
            borderRadius: '4px',
            overflowX: 'auto'
          }}>
            {diagramCode}
          </pre>
        </div>
      )}

      <div 
        ref={containerRef}
        style={{
          width: '100%',
          overflow: 'auto',
          padding: '20px',
          backgroundColor: '#f9f9f9',
          minHeight: '400px',
          transition: 'transform 0.2s ease'
        }}
      >
        <div 
          ref={diagramRef} 
          dangerouslySetInnerHTML={{ __html: svg }}
          style={{
            minWidth: 'min-content',
            minHeight: '400px'
          }}
        />
      </div>
    </div>
  );
};

export default ERDiagram;