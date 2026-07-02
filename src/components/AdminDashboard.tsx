'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  DollarSign, 
  Percent, 
  UserCheck, 
  MessageSquare, 
  Check, 
  X, 
  ExternalLink,
  MessageCircle,
  Clock,
  Eye,
  Settings
} from 'lucide-react';

interface Appointment {
  id: string;
  dateTime: string;
  status: string;
  whatsappSentAt: string | null;
  client: {
    name: string;
    phone: string;
  };
  barber: {
    name: string;
  };
  service: {
    name: string;
    price: number;
  };
}

interface Tenant {
  id: string;
  name: string;
  themeConfig: any;
}

interface AdminDashboardProps {
  initialAppointments: Appointment[];
  tenant: Tenant | null;
  views: number;
}

export default function AdminDashboard({ initialAppointments, tenant, views }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'appointments' | 'cms'>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [simulationResult, setSimulationResult] = useState<{ phone: string; message: string } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // CMS Form State
  const themeConfig = tenant?.themeConfig || {};
  const [heroName, setHeroName] = useState(themeConfig.heroName || 'ALEMÃO 777');
  const [instagram, setInstagram] = useState(themeConfig.instagram || 'https://www.instagram.com/barbeariadoalemao777/');
  const [whatsapp, setWhatsapp] = useState(themeConfig.whatsapp || '+5513974249209');
  const [address, setAddress] = useState(themeConfig.address || 'Rua Espanha, 360 - Jardim Casqueiro - Cubatão / SP');
  
  const defaultGallery = ['/haircut-fade.png', '/haircut-beard.png', '/haircut-classic.png'];
  const initialGallery = themeConfig.galleryUrls || defaultGallery;
  const [gallery1, setGallery1] = useState(initialGallery[0] || '');
  const [gallery2, setGallery2] = useState(initialGallery[1] || '');
  const [gallery3, setGallery3] = useState(initialGallery[2] || '');

  const [savingConfig, setSavingConfig] = useState(false);

  // Format price helper
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Status updates
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setAppointments(prev => 
          prev.map(app => app.id === id ? { ...app, status: newStatus } : app)
        );
      } else {
        alert('Erro ao atualizar status');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão');
    }
  };

  // WhatsApp simulation
  const handleSimulateWhatsApp = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch('/api/admin/simulate-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: id }),
      });
      if (res.ok) {
        const data = await res.json();
        setSimulationResult({ phone: data.phone, message: data.message });
        // Update local state to reflect WhatsApp sent
        setAppointments(prev => 
          prev.map(app => app.id === id ? { ...app, whatsappSentAt: new Date().toISOString() } : app)
        );
      } else {
        alert('Erro ao simular disparo');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  // CMS Save Config Handler
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await fetch('/api/admin/site-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heroName,
          instagram,
          whatsapp,
          address,
          galleryUrls: [gallery1, gallery2, gallery3],
        }),
      });

      if (res.ok) {
        alert('Configurações salvas com sucesso!');
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao salvar configurações.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar.');
    } finally {
      setSavingConfig(false);
    }
  };

  // Metrics calculation
  const totalBookings = appointments.length;
  const estimatedRevenue = appointments
    .filter(app => app.status === 'CONFIRMED' || app.status === 'COMPLETED')
    .reduce((sum, app) => sum + Number(app.service.price), 0);

  // Occupancy: 1 barber (Alemão) * 18 slots of 30min each = 18 slots total
  const totalSlots = 18;
  const occupiedSlots = appointments.filter(app => app.status !== 'CANCELED').length;
  const occupancyRate = totalBookings > 0 ? Math.min(Math.round((occupiedSlots / totalSlots) * 100), 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-graphite-border pb-6">
          <div>
            <span className="text-gold-primary uppercase tracking-[0.2em] text-xs font-semibold block mb-1">
              Painel de Controle
            </span>
            <h1 className="text-3xl font-bold font-serif text-white uppercase">BarberConnect</h1>
          </div>
          <div className="text-xs text-white/40 bg-graphite-dark px-4 py-2 border border-graphite-border">
            Hoje: {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-graphite-border gap-2">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-6 py-3 font-serif text-xs font-bold uppercase tracking-widest transition-colors duration-200 border-b-2 flex items-center gap-2 ${
              activeTab === 'appointments'
                ? 'border-gold-primary text-gold-primary'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Agendamentos
          </button>
          <button
            onClick={() => setActiveTab('cms')}
            className={`px-6 py-3 font-serif text-xs font-bold uppercase tracking-widest transition-colors duration-200 border-b-2 flex items-center gap-2 ${
              activeTab === 'cms'
                ? 'border-gold-primary text-gold-primary'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            Configurações do Site
          </button>
        </div>

        {/* Tab 1: Appointments & Metrics */}
        {activeTab === 'appointments' && (
          <>
            {/* Metrics Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Faturamento */}
              <div className="glass-panel p-6 flex items-center justify-between border border-gold-primary/10">
                <div>
                  <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Faturamento</span>
                  <h3 className="text-2xl font-bold text-gold-primary font-serif mt-1">
                    {formatPrice(estimatedRevenue)}
                  </h3>
                </div>
                <div className="p-3 bg-gold-primary/10 border border-gold-primary/20 text-gold-primary">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              {/* Card 2: Ocupação */}
              <div className="glass-panel p-6 flex items-center justify-between border border-gold-primary/10">
                <div>
                  <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Ocupação (1 Barb.)</span>
                  <h3 className="text-2xl font-bold text-white font-serif mt-1">
                    {occupancyRate}%
                  </h3>
                </div>
                <div className="p-3 bg-gold-primary/10 border border-gold-primary/20 text-gold-primary">
                  <Percent className="w-5 h-5" />
                </div>
              </div>

              {/* Card 3: Total Clientes */}
              <div className="glass-panel p-6 flex items-center justify-between border border-gold-primary/10">
                <div>
                  <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Agendamentos</span>
                  <h3 className="text-2xl font-bold text-white font-serif mt-1">
                    {totalBookings}
                  </h3>
                </div>
                <div className="p-3 bg-gold-primary/10 border border-gold-primary/20 text-gold-primary">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>

              {/* Card 4: Contador de Visualizações (Page Views) */}
              <div className="glass-panel p-6 flex items-center justify-between border border-gold-primary/10">
                <div>
                  <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Visitas no Site</span>
                  <h3 className="text-2xl font-bold text-white font-serif mt-1">
                    {views}
                  </h3>
                </div>
                <div className="p-3 bg-gold-primary/10 border border-gold-primary/20 text-gold-primary">
                  <Eye className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Appointments Table */}
            <div className="glass-panel overflow-hidden border border-gold-primary/10">
              <div className="px-6 py-4 border-b border-graphite-border bg-graphite-dark/40 flex justify-between items-center">
                <h3 className="font-serif text-lg font-bold text-white uppercase tracking-wider">Agendamentos de Hoje</h3>
                <span className="text-xs text-white/40">{appointments.length} encontrados</span>
              </div>

              {appointments.length === 0 ? (
                <div className="p-12 text-center text-white/40 text-sm font-light">
                  Nenhum agendamento registrado para hoje.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-graphite-border text-white/40 text-[10px] uppercase tracking-wider bg-black/20">
                        <th className="px-6 py-4 font-bold">Horário</th>
                        <th className="px-6 py-4 font-bold">Cliente</th>
                        <th className="px-6 py-4 font-bold">Serviço</th>
                        <th className="px-6 py-4 font-bold text-right">Valor</th>
                        <th className="px-6 py-4 font-bold text-center">Status</th>
                        <th className="px-6 py-4 font-bold text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-graphite-border/50 text-sm">
                      {appointments.map((app) => {
                        const appTime = new Date(app.dateTime).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <tr key={app.id} className="hover:bg-white/5 transition-colors duration-150">
                            <td className="px-6 py-4 font-bold text-gold-primary flex items-center gap-2 whitespace-nowrap">
                              <Clock className="w-4 h-4 text-gold-primary/60" />
                              {appTime}
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-white">{app.client.name}</div>
                              <a 
                                href={`https://wa.me/${app.client.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-white/40 hover:text-gold-primary flex items-center gap-1 mt-0.5 transition-colors"
                              >
                                <MessageCircle className="w-3 h-3" />
                                {app.client.phone}
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </td>
                            <td className="px-6 py-4 text-white/70">{app.service.name}</td>
                            <td className="px-6 py-4 text-right font-bold text-white">
                              {formatPrice(app.service.price)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2.5 py-1 text-[9px] uppercase font-bold tracking-wider ${
                                app.status === 'CONFIRMED' ? 'bg-gold-primary/10 text-gold-primary border border-gold-primary/30' :
                                app.status === 'PENDING_CONFIRMATION' ? 'bg-white/5 text-white/60 border border-white/10' :
                                app.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}>
                                {app.status === 'CONFIRMED' ? 'Confirmado' :
                                 app.status === 'PENDING_CONFIRMATION' ? 'Pendente' :
                                 app.status === 'COMPLETED' ? 'Finalizado' : 'Cancelado'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                {/* Complete Button */}
                                {app.status !== 'COMPLETED' && app.status !== 'CANCELED' && (
                                  <button
                                    onClick={() => handleUpdateStatus(app.id, 'COMPLETED')}
                                    title="Marcar como Concluído"
                                    className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/20 transition-all duration-200"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                )}

                                {/* Cancel Button */}
                                {app.status !== 'CANCELED' && app.status !== 'COMPLETED' && (
                                  <button
                                    onClick={() => handleUpdateStatus(app.id, 'CANCELED')}
                                    title="Cancelar Agendamento"
                                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-black border border-rose-500/20 transition-all duration-200"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}

                                {/* WhatsApp Simulation Button */}
                                {app.status === 'CONFIRMED' && (
                                  <button
                                    onClick={() => handleSimulateWhatsApp(app.id)}
                                    disabled={loadingId === app.id}
                                    title="Simular WhatsApp Lembrete"
                                    className="p-1.5 bg-gold-primary/10 hover:bg-gold-primary text-gold-primary hover:text-black border border-gold-primary/20 transition-all duration-200 disabled:opacity-50"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Tab 2: CMS Site Settings */}
        {activeTab === 'cms' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-8 max-w-3xl mx-auto border border-gold-primary/10"
          >
            <h3 className="font-serif text-xl font-bold text-white mb-6 uppercase tracking-wider border-b border-graphite-border pb-4">
              Configurações do Site (CMS)
            </h3>
            
            <form onSubmit={handleSaveConfig} className="space-y-6 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Brand Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
                    Nome da Marca (Hero)
                  </label>
                  <input
                    type="text"
                    required
                    value={heroName}
                    onChange={(e) => setHeroName(e.target.value)}
                    className="w-full px-4 py-3 bg-graphite-light border border-graphite-border focus:border-gold-primary text-white outline-none transition-all duration-300"
                    placeholder="Ex: ALEMÃO 777"
                  />
                </div>

                {/* WhatsApp Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
                    WhatsApp de Atendimento
                  </label>
                  <input
                    type="text"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-4 py-3 bg-graphite-light border border-graphite-border focus:border-gold-primary text-white outline-none transition-all duration-300"
                    placeholder="Ex: +5513974249209"
                  />
                </div>

                {/* Instagram Link */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
                    Link do Instagram
                  </label>
                  <input
                    type="url"
                    required
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="w-full px-4 py-3 bg-graphite-light border border-graphite-border focus:border-gold-primary text-white outline-none transition-all duration-300"
                    placeholder="Ex: https://www.instagram.com/barbeariadoalemao777/"
                  />
                </div>

                {/* Address */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
                    Endereço / Localização
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-graphite-light border border-graphite-border focus:border-gold-primary text-white outline-none transition-all duration-300"
                    placeholder="Ex: Rua Espanha, 360 - Jardim Casqueiro - Cubatão / SP"
                  />
                </div>

                {/* Gallery Images URLs */}
                <div className="space-y-1.5 md:col-span-2 border-t border-graphite-border/60 pt-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                    Fotos da Galeria (URLs das Imagens)
                  </label>
                  
                  <div className="space-y-4 mt-2">
                    <div className="flex gap-3 items-center">
                      <span className="text-xs text-white/40 w-16">Foto 1:</span>
                      <input
                        type="text"
                        required
                        value={gallery1}
                        onChange={(e) => setGallery1(e.target.value)}
                        className="w-full px-4 py-2 bg-graphite-light border border-graphite-border focus:border-gold-primary text-white outline-none transition-all duration-300"
                        placeholder="/haircut-fade.png"
                      />
                    </div>
                    
                    <div className="flex gap-3 items-center">
                      <span className="text-xs text-white/40 w-16">Foto 2:</span>
                      <input
                        type="text"
                        required
                        value={gallery2}
                        onChange={(e) => setGallery2(e.target.value)}
                        className="w-full px-4 py-2 bg-graphite-light border border-graphite-border focus:border-gold-primary text-white outline-none transition-all duration-300"
                        placeholder="/haircut-beard.png"
                      />
                    </div>

                    <div className="flex gap-3 items-center">
                      <span className="text-xs text-white/40 w-16">Foto 3:</span>
                      <input
                        type="text"
                        required
                        value={gallery3}
                        onChange={(e) => setGallery3(e.target.value)}
                        className="w-full px-4 py-2 bg-graphite-light border border-graphite-border focus:border-gold-primary text-white outline-none transition-all duration-300"
                        placeholder="/haircut-classic.png"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4 border-t border-graphite-border">
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-8 py-4 bg-gold-primary hover:bg-gold-hover disabled:bg-gold-primary/30 text-black font-bold text-xs tracking-wider uppercase transition-all duration-300"
                >
                  {savingConfig ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Simulated Message Modal */}
        {simulationResult && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-panel max-w-md w-full p-6 space-y-6 relative border border-gold-primary/20"
            >
              <button 
                onClick={() => setSimulationResult(null)}
                className="absolute top-4 right-4 text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 border-b border-graphite-border pb-4">
                <div className="p-2 bg-gold-primary/10 text-gold-primary">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-serif text-lg font-bold text-white uppercase tracking-wide">Simulação de WhatsApp</h4>
                  <p className="text-xs text-white/40 font-light">Destinatário: {simulationResult.phone}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-white/40 font-bold uppercase tracking-wider">Conteúdo da Mensagem</label>
                <div className="bg-black/40 border border-graphite-border p-4 text-sm text-white/85 leading-relaxed font-mono whitespace-pre-wrap rounded-none">
                  {simulationResult.message}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSimulationResult(null)}
                  className="px-6 py-2.5 bg-gold-primary hover:bg-gold-hover text-black font-bold text-xs tracking-wider uppercase transition-all duration-300"
                >
                  Fechar Simulação
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
}
