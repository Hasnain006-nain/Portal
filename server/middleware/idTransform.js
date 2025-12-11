// Middleware to transform MySQL 'id' to MongoDB-style '_id' for frontend compatibility
function transformIdToMongo(obj) {
    if (!obj) return obj;
    
    if (Array.isArray(obj)) {
        return obj.map(item => transformIdToMongo(item));
    }
    
    if (typeof obj === 'object') {
        const transformed = { ...obj };
        
        // Transform id to _id
        if ('id' in transformed) {
            transformed._id = transformed.id;
            // Keep id as well for compatibility
        }
        
        // Transform book fields (database uses available_copies, frontend expects available)
        if ('available_copies' in transformed) {
            transformed.available = transformed.available_copies;
        }
        if ('total_copies' in transformed) {
            transformed.total = transformed.total_copies;
        }
        
        // Transform nested objects
        Object.keys(transformed).forEach(key => {
            if (typeof transformed[key] === 'object' && transformed[key] !== null) {
                transformed[key] = transformIdToMongo(transformed[key]);
            }
        });
        
        return transformed;
    }
    
    return obj;
}

// Middleware function
function idTransformMiddleware(req, res, next) {
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
        const transformed = transformIdToMongo(data);
        return originalJson(transformed);
    };
    
    next();
}

module.exports = idTransformMiddleware;
