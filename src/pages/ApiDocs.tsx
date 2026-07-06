import React from 'react';

export default function ApiDocs() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-4">
        <h1 className="section-title">Sense My Pet API</h1>
        <p className="section-subtitle">Integrate warm, empathetic pet wellness AI into your applications.</p>
      </div>

      <div className="card mb-4">
        <h2>Overview</h2>
        <p className="text-muted mt-4">
          The Sense My Pet API allows third-party developers to access our emotional analysis models for pets. 
          Use this API to analyze pet audio vocalizations and video posture to determine emotional states such as calmness, anxiety, and excitement.
        </p>
      </div>

      <div className="card mb-4">
        <h2>Authentication</h2>
        <p className="text-muted mt-4">
          All API requests require a Bearer token in the Authorization header.
        </p>
        <pre style={{ background: '#f4f4f4', padding: '1rem', borderRadius: '8px', marginTop: '1rem', overflowX: 'auto' }}>
          <code>
            Authorization: Bearer YOUR_API_KEY
          </code>
        </pre>
      </div>

      <div className="card mb-4">
        <h2>Endpoints</h2>
        
        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--color-accent)' }}>POST /v1/audio/analyze</h3>
          <p className="text-muted mb-4">Analyzes a pet's vocalization to detect emotional state.</p>
          <pre style={{ background: '#f4f4f4', padding: '1rem', borderRadius: '8px', overflowX: 'auto' }}>
            <code>
{`{
  "animal_type": "dog",
  "audio_url": "https://example.com/audio.wav"
}`}
            </code>
          </pre>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--color-accent)' }}>POST /v1/video/posture</h3>
          <p className="text-muted mb-4">Analyzes a single frame or short video clip for body language indicators.</p>
          <pre style={{ background: '#f4f4f4', padding: '1rem', borderRadius: '8px', overflowX: 'auto' }}>
            <code>
{`{
  "animal_type": "cat",
  "image_url": "https://example.com/frame.jpg"
}`}
            </code>
          </pre>
        </div>
      </div>
      
      <p className="text-center text-muted mt-4" style={{ marginBottom: '4rem' }}>
        For premium API extensions, please contact support.
      </p>
    </div>
  );
}
