// ULTRA SIMPLE AUTH API - NO DEPENDENCIES
module.exports = (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Parse URL
    const url = req.url;
    
    // Health check
    if (url === '/api/health') {
        res.status(200).json({ status: 'ok', message: 'Server running' });
        return;
    }
    
    // Login endpoint
    if (url === '/api/auth/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const { email, password } = JSON.parse(body);
                
                // Simple auth check
                if (email === 'admin@university.edu' && password === 'admin123') {
                    res.status(200).json({
                        token: 'admin-token-123',
                        user: {
                            id: 1,
                            email: 'admin@university.edu',
                            name: 'System Administrator',
                            role: 'admin',
                            approved: true
                        }
                    });
                } else if (email === 'john.doe@university.edu' && password === 'student123') {
                    res.status(200).json({
                        token: 'student-token-123',
                        user: {
                            id: 2,
                            email: 'john.doe@university.edu',
                            name: 'John Doe',
                            role: 'student',
                            approved: true
                        }
                    });
                } else {
                    res.status(401).json({ error: 'Invalid credentials' });
                }
            } catch (error) {
                res.status(400).json({ error: 'Invalid request' });
            }
        });
        return;
    }
    
    // Register endpoint
    if (url === '/api/auth/register' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                res.status(201).json({ 
                    message: 'Registration submitted. Awaiting admin approval.', 
                    userId: Math.floor(Math.random() * 1000)
                });
            } catch (error) {
                res.status(400).json({ error: 'Invalid request' });
            }
        });
        return;
    }
    
    // Default 404
    res.status(404).json({ error: 'Not found' });
};
