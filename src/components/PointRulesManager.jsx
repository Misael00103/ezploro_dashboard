import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Flame, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  Save, 
  RefreshCw, 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  Layers,
  Database,
  Cpu,
  UserCheck,
  Search,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { getAllRules, createRule, updateRule, deleteRule } from '../services/rulesService';
import { toast } from 'react-hot-toast';

export const PointRulesManager = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingAttendanceRule, setSavingAttendanceRule] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado específico para la regla oficial de asistencia presencial requerida
  const [attendanceRule, setAttendanceRule] = useState({
    id: null,
    rule_id: null,
    rule_name: 'Vive la experiencia presencial!',
    point_type: 'Events',
    points: 15,
    is_active: true,
    description: 'Puntos otorgados automáticamente por validación GPS al confirmar asistencia presencial a un evento.'
  });

  // Modal para crear / editar reglas generales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [formData, setFormData] = useState({
    rule_name: '',
    point_type: 'Profile',
    points: 10,
    description: '',
    is_active: true
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const data = await getAllRules();
      const rulesList = Array.isArray(data) ? data : [];
      setRules(rulesList);

      // Buscar la regla oficial "Vive la experiencia presencial!" o de tipo Events
      const foundAttendanceRule = rulesList.find(r => 
        (r.rule_name && r.rule_name.toLowerCase().includes('presencial')) ||
        (r.rule_name && r.rule_name.toLowerCase().includes('vive la experiencia')) ||
        (r.rule_name === 'Vive la experiencia presencial!')
      );

      if (foundAttendanceRule) {
        setAttendanceRule({
          id: foundAttendanceRule.id || foundAttendanceRule.rule_id,
          rule_id: foundAttendanceRule.rule_id || foundAttendanceRule.id,
          rule_name: foundAttendanceRule.rule_name,
          point_type: foundAttendanceRule.point_type || 'Events',
          points: Number(foundAttendanceRule.points) || 15,
          is_active: foundAttendanceRule.is_active !== undefined ? foundAttendanceRule.is_active : true,
          description: foundAttendanceRule.description || 'Puntos otorgados automáticamente por validación GPS al confirmar asistencia presencial a un evento.'
        });
      }
    } catch (e) {
      console.error('Error al cargar reglas:', e);
      toast.error('Error al cargar las reglas de puntos');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Guarda en caliente la regla oficial de asistencia presencial
   */
  const handleSaveAttendanceRule = async (e) => {
    if (e) e.preventDefault();
    try {
      setSavingAttendanceRule(true);
      const payload = {
        rule_name: attendanceRule.rule_name,
        point_type: attendanceRule.point_type,
        points: parseInt(attendanceRule.points, 10) || 15,
        is_active: attendanceRule.is_active,
        description: attendanceRule.description
      };

      if (attendanceRule.id) {
        // Actualizar regla existente vía PUT /api/point-rules/:id
        await updateRule(attendanceRule.id, payload);
        toast.success(`¡Regla presencial actualizada en caliente! Ahora otorga ${payload.points} puntos`);
      } else {
        // Si no existía, crear la regla oficial
        const created = await createRule(payload);
        const newId = created?.id || created?.rule_id;
        setAttendanceRule(prev => ({ ...prev, id: newId, rule_id: newId }));
        toast.success(`¡Regla presencial oficial creada en caliente con ${payload.points} puntos!`);
      }

      await loadRules();
    } catch (error) {
      console.error('Error al guardar regla presencial:', error);
      toast.error(error.message || 'Error al actualizar la regla presencial');
    } finally {
      setSavingAttendanceRule(false);
    }
  };

  /**
   * Toggle directo del switch activo para cualquier regla
   */
  const handleToggleRule = async (rule) => {
    const rId = rule.id || rule.rule_id;
    try {
      const updated = await updateRule(rId, {
        rule_name: rule.rule_name,
        point_type: rule.point_type,
        points: rule.points,
        is_active: !rule.is_active
      });
      setRules(prev => prev.map(r => (r.id === rId || r.rule_id === rId) ? { ...r, is_active: !rule.is_active } : r));
      toast.success(`Regla "${rule.rule_name}" ${!rule.is_active ? 'activada' : 'desactivada'}`);
    } catch (e) {
      console.error('Error al alternar regla:', e);
      toast.error('Error al cambiar estado de la regla');
    }
  };

  const handleOpenEdit = (rule) => {
    setSelectedRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      point_type: rule.point_type || 'Events',
      points: rule.points || 10,
      description: rule.description || '',
      is_active: rule.is_active !== undefined ? rule.is_active : true
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateRuleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRule) return;
    try {
      const rId = selectedRule.id || selectedRule.rule_id;
      await updateRule(rId, formData);
      toast.success('Regla actualizada exitosamente');
      setIsEditModalOpen(false);
      setSelectedRule(null);
      loadRules();
    } catch (e) {
      toast.error(e.message || 'Error al actualizar regla');
    }
  };

  const handleCreateRuleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createRule(formData);
      toast.success('Regla creada exitosamente');
      setIsCreateModalOpen(false);
      setFormData({
        rule_name: '',
        point_type: 'Profile',
        points: 10,
        description: '',
        is_active: true
      });
      loadRules();
    } catch (e) {
      toast.error(e.message || 'Error al crear regla');
    }
  };

  const handleDeleteRule = async (rule) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la regla "${rule.rule_name}"?`)) return;
    const rId = rule.id || rule.rule_id;
    try {
      await deleteRule(rId);
      toast.success('Regla eliminada');
      loadRules();
    } catch (e) {
      toast.error('Error al eliminar regla');
    }
  };

  const filteredRules = rules.filter(r => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (r.rule_name || '').toLowerCase().includes(q) ||
           (r.point_type || '').toLowerCase().includes(q) ||
           (r.description || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-600/10 border border-violet-500/20 rounded-2xl text-violet-400">
            <Zap className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Control de Reglas de Gamificación</h1>
            <p className="text-slate-400 mt-1">
              Edición en caliente de las reglas de puntos del sistema (<code className="text-purple-300">point_rules</code> / <code className="text-purple-300">PUT /api/point-rules/:id</code>)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={loadRules}
            variant="outline"
            className="border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin text-violet-400' : ''}`} />
            Recargar
          </Button>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-violet-600 hover:bg-violet-500 text-white font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Regla
          </Button>
        </div>
      </div>

      {/* 1. SECCIÓN DESTACADA: REGLA OFICIAL DE ASISTENCIA PRESENCIAL */}
      <Card className="bg-gradient-to-br from-violet-950/40 via-slate-950 to-slate-900 border-2 border-violet-500/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <CardHeader className="p-6 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-violet-500/20 text-violet-300 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  Regla Oficial: Asistencia Presencial
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs font-semibold">
                    En Caliente (Hot-Reload)
                  </Badge>
                </CardTitle>
                <CardDescription className="text-violet-300/80 text-xs">
                  Modifica los puntos otorgados por validación GPS. El backend acreditará este nuevo valor inmediatamente a todas las confirmaciones subsiguientes.
                </CardDescription>
              </div>
            </div>

            {/* Switch de Estado */}
            <div className="flex items-center space-x-3 bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-2xl">
              <span className="text-xs font-semibold text-slate-300">
                Estado: {attendanceRule.is_active ? (
                  <span className="text-emerald-400 font-bold">Activa</span>
                ) : (
                  <span className="text-rose-400 font-bold">Inactiva</span>
                )}
              </span>
              <Switch
                checked={attendanceRule.is_active}
                onCheckedChange={(checked) => setAttendanceRule({ ...attendanceRule, is_active: checked })}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-2">
          {/* Diagrama de Flujo en Caliente (Mermaid visual) */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 mb-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400 block mb-2">
              Flujo de Actualización en Caliente
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center text-xs">
              <div className="bg-slate-900 border border-violet-500/30 rounded-xl p-3 text-center">
                <div className="font-bold text-white mb-1">1. Admin en Dashboard</div>
                <div className="text-slate-400 text-[11px]">Modifica puntos en formulario</div>
              </div>
              <div className="hidden sm:flex justify-center text-violet-400 font-mono text-xs">
                <ArrowRight className="w-4 h-4" />
              </div>
              <div className="bg-slate-900 border border-violet-500/30 rounded-xl p-3 text-center">
                <div className="font-bold text-white mb-1">2. Tabla point_rules</div>
                <div className="text-slate-400 text-[11px]">PUT /api/point-rules/:id</div>
              </div>
              <div className="hidden sm:flex justify-center text-violet-400 font-mono text-xs">
                <ArrowRight className="w-4 h-4" />
              </div>
              <div className="bg-slate-900 border border-violet-500/30 rounded-xl p-3 text-center">
                <div className="font-bold text-white mb-1">3. EventSubscriptionsService</div>
                <div className="text-slate-400 text-[11px]">Lee regla presencial sin reiniciar</div>
              </div>
              <div className="hidden sm:flex justify-center text-violet-400 font-mono text-xs">
                <ArrowRight className="w-4 h-4" />
              </div>
              <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-3 text-center">
                <div className="font-bold text-emerald-400 mb-1">4. Usuarios Presenciales</div>
                <div className="text-slate-400 text-[11px]">Ganan {attendanceRule.points} Pts instantáneos</div>
              </div>
            </div>
          </div>

          {/* Formulario de la Regla Oficial */}
          <form onSubmit={handleSaveAttendanceRule} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* 1. Regla */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-300">
                1. Nombre Oficial de la Regla
              </Label>
              <Input
                value={attendanceRule.rule_name}
                onChange={(e) => setAttendanceRule({ ...attendanceRule, rule_name: e.target.value })}
                className="bg-slate-900 border-slate-800 text-white font-medium text-xs h-10"
                required
              />
            </div>

            {/* 2. Tipo de Puntos */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-300">
                2. Tipo de Puntos
              </Label>
              <div className="h-10 px-3 bg-slate-900 border border-slate-800 rounded-md flex items-center justify-between text-xs">
                <span className="text-white font-medium">Eventos</span>
                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">
                  Presencial
                </Badge>
              </div>
            </div>

            {/* 3. Puntos Otorgados (Input Numérico) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold text-slate-300">
                  3. Puntos Otorgados
                </Label>
                <div className="flex gap-1">
                  {[15, 25, 50].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAttendanceRule({ ...attendanceRule, points: val })}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                        Number(attendanceRule.points) === val
                          ? 'bg-violet-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  value={attendanceRule.points}
                  onChange={(e) => setAttendanceRule({ ...attendanceRule, points: parseInt(e.target.value, 10) || 1 })}
                  className="bg-slate-900 border-violet-500/40 text-amber-300 font-bold text-base h-10 pr-12 focus:border-violet-500"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  Pts
                </span>
              </div>
            </div>

            {/* 4. Botón Guardar en Caliente */}
            <div>
              <Button
                type="submit"
                disabled={savingAttendanceRule}
                className="w-full h-10 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2"
              >
                {savingAttendanceRule ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Actualizar en Caliente
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 2. TABLA COMPLETA DE REGLAS DE PUNTOS */}
      <Card className="bg-slate-950 border-slate-800 shadow-xl">
        <CardHeader className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-white text-lg">Catálogo Completo de Reglas</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Todas las reglas activas de gamificación asignadas a usuarios por sus acciones en la plataforma
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar reglas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-900 border-slate-800 text-white text-xs h-9"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-5">Regla</th>
                <th className="py-3 px-5">Tipo</th>
                <th className="py-3 px-5">Puntos</th>
                <th className="py-3 px-5">Descripción</th>
                <th className="py-3 px-5">Estado</th>
                <th className="py-3 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-500">
                    No se encontraron reglas de puntos.
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => {
                  const rId = rule.id || rule.rule_id;
                  const isAttendance = (rule.rule_name || '').toLowerCase().includes('presencial') ||
                                       (rule.rule_name || '').toLowerCase().includes('vive la experiencia');

                  return (
                    <tr key={rId} className={`hover:bg-slate-900/50 transition-colors ${isAttendance ? 'bg-violet-950/10' : ''}`}>
                      <td className="py-3.5 px-5 font-bold text-white">
                        <div className="flex items-center gap-2">
                          {isAttendance && <Sparkles className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />}
                          <span>{rule.rule_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <Badge className={`text-xs ${
                          rule.point_type === 'Events' 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : rule.point_type === 'Profile'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {rule.point_type}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          +{rule.points} Pts
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-400 truncate max-w-xs">
                        {rule.description || 'Sin descripción'}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={() => handleToggleRule(rule)}
                          />
                          <span className={`text-[11px] font-semibold ${rule.is_active ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {rule.is_active ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(rule)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRule(rule)}
                            className="h-8 w-8 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Modal Crear Regla */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-slate-950 border border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">Nueva Regla de Puntos</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Define una nueva regla para otorgar puntos automáticamente
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateRuleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Nombre de la Regla *</Label>
              <Input
                value={formData.rule_name}
                onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                placeholder="Ej: Compartir en redes sociales"
                className="bg-slate-900 border-slate-800 text-white text-xs"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">Tipo de Punto *</Label>
                <select
                  value={formData.point_type}
                  onChange={(e) => setFormData({ ...formData, point_type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-white text-xs focus:outline-none focus:border-violet-500"
                  required
                >
                  <option value="Profile">Perfil</option>
                  <option value="Events">Eventos</option>
                  <option value="Engagement">Compromiso</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">Puntos *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value, 10) || 1 })}
                  className="bg-slate-900 border-slate-800 text-white text-xs"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Descripción</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del criterio para otorgar estos puntos..."
                className="bg-slate-900 border-slate-800 text-white text-xs"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label className="text-xs text-slate-300">Regla Activa</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs"
              >
                Crear Regla
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Regla */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-slate-950 border border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">Editar Regla de Puntos</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Modifica los parámetros de la regla
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateRuleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Nombre de la Regla *</Label>
              <Input
                value={formData.rule_name}
                onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                className="bg-slate-900 border-slate-800 text-white text-xs"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">Tipo de Punto *</Label>
                <select
                  value={formData.point_type}
                  onChange={(e) => setFormData({ ...formData, point_type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-white text-xs focus:outline-none focus:border-violet-500"
                  required
                >
                  <option value="Profile">Perfil</option>
                  <option value="Events">Eventos</option>
                  <option value="Engagement">Compromiso</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">Puntos *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value, 10) || 1 })}
                  className="bg-slate-900 border-slate-800 text-white text-xs"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Descripción</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-900 border-slate-800 text-white text-xs"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label className="text-xs text-slate-300">Regla Activa</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs"
              >
                Actualizar Regla
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PointRulesManager;
