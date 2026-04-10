import React, { useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/src/components/ui/Card';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isLogin && password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: fullName,
            }
          }
        });
        if (error) throw error;
        setShowConfirmation(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowPassword(!showPassword);
  };

  const passwordToggle = (
    <button
      type="button"
      onClick={togglePasswordVisibility}
      className="focus:outline-none hover:text-slate-600 transition-colors"
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );

  if (showConfirmation) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="text-center p-8 bg-white border-none shadow-2xl">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <CardTitle className="mb-2 text-primary-600 font-bold">Verifica tu correo</CardTitle>
            <p className="text-slate-600 mb-6">
              Hemos enviado un enlace de verificación a <span className="font-semibold text-slate-900">{email}</span>. 
              Por favor, haz clic en el enlace del correo para completar tu registro.
            </p>
            <Button variant="outline" className="w-full border-primary-200 text-primary-600 hover:bg-primary-50" onClick={() => setShowConfirmation(false)}>
              Volver al Inicio de Sesión
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white border-none shadow-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50 p-3 shadow-inner">
              <img src="/icon.svg?v=2" alt="Santo Pecado Logo" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <CardTitle className="text-center text-3xl font-bold text-primary-600">
              {isLogin ? 'Santo Pecado' : 'Crear Cuenta'}
            </CardTitle>
            <p className="text-center text-sm text-slate-500">
              {isLogin ? 'Ingresa tus credenciales para acceder' : 'Únete a nuestra plataforma de medios hoy'}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <Input
                    label="Nombre Completo"
                    labelClassName="text-primary-600 font-bold"
                    type="text"
                    placeholder="Juan Pérez"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </motion.div>
              )}
              <Input
                label="Correo Electrónico"
                labelClassName="text-primary-600 font-bold"
                type="email"
                placeholder="nombre@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Contraseña"
                labelClassName="text-primary-600 font-bold"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                rightElement={passwordToggle}
                required
              />
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Input
                    label="Confirmar Contraseña"
                    labelClassName="text-primary-600 font-bold"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    rightElement={passwordToggle}
                    required
                  />
                </motion.div>
              )}
              {error && (
                <p className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-100">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" isLoading={loading}>
                {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary-600 hover:underline"
            >
              {isLogin ? "¿No tienes cuenta? Regístrate" : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
