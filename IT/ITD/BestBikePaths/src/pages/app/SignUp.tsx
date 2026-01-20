import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext'; // Hook creato nel passo precedente
import { useNavigate, Link } from 'react-router-dom';

const SignUp = () => {
  // Hook per la logica di autenticazione e navigazione
  const { signUp } = useAuth();
  const navigate = useNavigate();

  // Stato locale per i campi del form (UC1: submit_data) [cite: 333]
  const [formData, setFormData] = useState({
    surname: '',
    name: '',
    city: '',
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  //const [loading, setLoading] = useState(false);

  // Gestione input generica
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // 1. Flusso Registrazione Standard (Email/Password)
  // Corrisponde al ramo "Standard Email Registration" di Figura 2.2 [cite: 331]
  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setError('');
    //setLoading(true);

    try {
      // Chiama la funzione signUp del Context, passando anche nome e cognome
      // per il trigger della tabella 'profiles'.
      await signUp(
        formData.email, 
        formData.password, 
        formData.surname, 
        formData.name,
        formData.city
      );
      
      // Se successo, reindirizza alla Dashboard (o pagina di verifica email)
      // Vedi Figura 2.2: show_dashboard() [cite: 335]
      navigate('/app'); 
    } catch (err) {
      // Gestione errori (es. password troppo corta, email già in uso)
      setError('Errore durante la registrazione: ' + err.message);
    } finally {
      //setLoading(false);
    }
  };

  /* style={styles.card}
  style={styles.form}
  style={styles.inputGroup}
  style={styles.inputGroup}
  style={styles.inputGroup}
  style={styles.inputGroup}
  */
  return (
    <div style={styles.container}>
      <div> 
        <h2>Crea un Account</h2>
        <p>Unisciti a Best Bike Paths per tracciare i tuoi percorsi.</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleEmailSignup} >
          {/* Campi Nome e Cognome richiesti per il Profilo (Fig 3.5)  */}
          <div >
            <label>Nome</label>
            <input
              type="text"
              name="surname"
              value={formData.surname}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>Cognome</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div >
            <label>Città</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              // Supabase richiede min 6 caratteri di default
            />
          </div>

          <button type="submit" style={styles.buttonPrimary}>
            {'Registrati con Email'}
          </button>
        </form>

        <div style={styles.divider}>oppure</div>

        <p style={styles.footerText}>
          Hai già un account? <Link to="/login">Accedi qui</Link>
        </p>
      </div>
    </div>
  );
};

// Stili CSS base (inline per semplicità dell'esempio)
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f4f4f4',
  },
  card: {
    padding: '2rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '1.5rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '0.5rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  buttonPrimary: {
    padding: '0.75rem',
    backgroundColor: '#10B981', // Colore verde stile "Best Bike Paths" mockups [cite: 635]
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
  },
  buttonGoogle: {
    padding: '0.75rem',
    backgroundColor: '#4285F4',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%',
    marginTop: '0.5rem',
  },
  divider: {
    margin: '1.5rem 0',
    color: '#888',
    fontSize: '0.9rem',
  },
  footerText: {
    marginTop: '1.5rem',
    fontSize: '0.9rem',
  },
};

export default SignUp;