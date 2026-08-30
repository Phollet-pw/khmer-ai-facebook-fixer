import React from 'react';

const Login = ({ onFacebookLogin, onTryFree }) => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#111827',
      padding: '20px',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        backgroundColor: '#1f2937',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
        border: '1px solid #374151',
        width: '100%',
        maxWidth: '420px',
        textAlign: 'center'
      }}>
        {/* Logo ឬ ឈ្មោះប្រព័ន្ធ */}
        <h2 style={{ color: 'white', marginBottom: '10px', fontSize: '26px', fontWeight: 'bold' }}>
          Khmer AI
        </h2>
        <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '30px' }}>
          Facebook Fixer Dashboard
        </p>

        {/* ប៊ូតុងចម្បង: Login ជាមួយ Facebook */}
        <button 
          onClick={onFacebookLogin}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: '#1877F2', /* ពណ៌ខៀវ Facebook ស្តង់ដារ */
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            transition: 'background-color 0.2s',
            marginBottom: '15px'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#166fe5'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#1877F2'}
        >
          {/* Facebook SVG Icon */}
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          ចូលប្រើប្រាស់ជាមួយ Facebook
        </button>

        <div style={{ color: '#4b5563', margin: '20px 0', fontSize: '14px' }}>ឬ</div>

        {/* ប៊ូតុងសាកល្បងឥតគិតថ្លៃ */}
        <button 
          onClick={onTryFree}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#10B981', /* ពណ៌បៃតង Premium */
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#10B981'}
        >
          🎁 សាកល្បងឥតគិតថ្លៃ ១ ដង — Try Free Once
        </button>

        <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '25px' }}>
          *យើងខ្ញុំត្រូវការសិទ្ធិដើម្បីពិនិត្យ និងដោះស្រាយបញ្ហា Page របស់អ្នកតែប៉ុណ្ណោះ។
        </p>
      </div>
    </div>
  );
};

export default Login;