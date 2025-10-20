import React, { useEffect, useState } from 'react';
import { debugAuthState, validateAuth } from '../services/authUtils';
import { getCurrentUserId } from '../services/authService';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

const AuthDebug = () => {
  const [authInfo, setAuthInfo] = useState({});

  const refreshAuthInfo = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const userId = localStorage.getItem('userId');
    const currentUserId = getCurrentUserId();
    const validation = validateAuth();

    setAuthInfo({
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token',
      hasUser: !!user,
      userObject: user ? JSON.parse(user) : null,
      storedUserId: userId,
      computedUserId: currentUserId,
      validation
    });

    // Also log to console
    debugAuthState();
  };

  useEffect(() => {
    refreshAuthInfo();
  }, []);

  return (
    <Card className="bg-black/40 border-purple-500/30 mb-4">
      <CardHeader>
        <CardTitle className="text-white">🔍 Debug de Autenticación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-purple-200 text-sm space-y-1">
          <p><strong>Token:</strong> {authInfo.hasToken ? '✅' : '❌'} ({authInfo.tokenLength} chars)</p>
          <p><strong>Token Preview:</strong> {authInfo.tokenPreview}</p>
          <p><strong>User Object:</strong> {authInfo.hasUser ? '✅' : '❌'}</p>
          <p><strong>Stored User ID:</strong> {authInfo.storedUserId || 'null'}</p>
          <p><strong>Computed User ID:</strong> {authInfo.computedUserId || 'null'}</p>
          <p><strong>Validation:</strong> {authInfo.validation?.valid ? '✅' : '❌'} 
            {!authInfo.validation?.valid && ` (${authInfo.validation?.reason})`}
          </p>
          {authInfo.userObject && (
            <div>
              <p><strong>User Object Keys:</strong> {Object.keys(authInfo.userObject).join(', ')}</p>
              <p><strong>User ID Fields:</strong> 
                user_id: {authInfo.userObject.user_id || 'undefined'}, 
                id: {authInfo.userObject.id || 'undefined'}, 
                _id: {authInfo.userObject._id || 'undefined'}
              </p>
            </div>
          )}
        </div>
        <Button 
          onClick={refreshAuthInfo}
          className="bg-purple-600 hover:bg-purple-700 text-white"
          size="sm"
        >
          Actualizar Info
        </Button>
      </CardContent>
    </Card>
  );
};

export default AuthDebug;