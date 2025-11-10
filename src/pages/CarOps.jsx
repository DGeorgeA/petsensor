import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Droplets, Power, Camera, Lock, Unlock, Thermometer, Zap, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import GlassCard from "../components/ui/GlassCard";
import GlassButton from "../components/ui/GlassButton";
import { toast } from "sonner";
import { format } from "date-fns";

export default function CarOps() {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [targetTemp, setTargetTemp] = useState(72);
  const queryClient = useQueryClient();

  // Fetch user's vehicles
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list(),
  });

  // Fetch recent commands for selected vehicle
  const { data: recentCommands = [], isLoading: commandsLoading } = useQuery({
    queryKey: ['car-commands', selectedVehicle?.id],
    queryFn: () => selectedVehicle 
      ? base44.entities.CarOpCommand.filter({ vehicle_id: selectedVehicle.id }, '-executed_at', 10)
      : Promise.resolve([]),
    enabled: !!selectedVehicle,
    refetchInterval: 3000, // Poll every 3 seconds
  });

  // Auto-select first vehicle
  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicle) {
      setSelectedVehicle(vehicles[0]);
    }
  }, [vehicles]);

  // Command execution mutation
  const executeCommandMutation = useMutation({
    mutationFn: async ({ commandType, parameters }) => {
      // Create command record with pending status
      const command = await base44.entities.CarOpCommand.create({
        vehicle_id: selectedVehicle.id,
        command_type: commandType,
        command_parameters: parameters || {},
        status: 'pending',
        executed_at: new Date().toISOString(),
        initiated_by: 'user@example.com',
      });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock vendor API response
      const mockResponses = {
        precool: {
          cabin_temp: 85,
          target_temp: parameters?.temperature || 72,
          estimated_time: '10 minutes',
          fan_speed: 'high',
          ac_status: 'on',
        },
        preheat: {
          cabin_temp: 45,
          target_temp: parameters?.temperature || 72,
          estimated_time: '8 minutes',
          heater_status: 'on',
        },
        start: {
          engine_status: 'running',
          battery_level: 78,
          fuel_level: 65,
          odometer: selectedVehicle.mileage,
        },
        stop: {
          engine_status: 'off',
          doors_locked: true,
          windows_closed: true,
        },
        lock: {
          doors_locked: true,
          windows_closed: true,
          alarm_armed: true,
        },
        unlock: {
          doors_locked: false,
          alarm_armed: false,
        },
        dashcam_on: {
          recording: true,
          storage_available: '42GB',
          resolution: '1080p',
          mode: 'parking',
        },
        dashcam_off: {
          recording: false,
          footage_saved: true,
        },
      };

      const success = Math.random() > 0.1; // 90% success rate

      // Update command with result
      await base44.entities.CarOpCommand.update(command.id, {
        status: success ? 'success' : 'failed',
        completed_at: new Date().toISOString(),
        response_data: success ? mockResponses[commandType] : null,
        error_message: success ? null : 'Vehicle API timeout. Please try again.',
      });

      return { command, success, response: mockResponses[commandType] };
    },
    onSuccess: ({ success, response, command }) => {
      queryClient.invalidateQueries({ queryKey: ['car-commands'] });
      
      if (success) {
        toast.success(`Command executed successfully!`, {
          description: `${command.command_type} completed`,
        });
      } else {
        toast.error('Command failed', {
          description: 'Please check vehicle connectivity',
        });
      }
    },
    onError: (error) => {
      toast.error('Failed to execute command', {
        description: error.message,
      });
    },
  });

  const handleCommand = (commandType, parameters = {}) => {
    if (!selectedVehicle) {
      toast.error('Please select a vehicle first');
      return;
    }

    if (selectedVehicle.api_provider === 'none') {
      toast.error('Vehicle not connected', {
        description: 'This vehicle does not have API integration enabled',
      });
      return;
    }

    executeCommandMutation.mutate({ commandType, parameters });
  };

  const getProviderBadge = (provider) => {
    const badges = {
      smartcar: { label: 'Smartcar', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      suzuki_connect: { label: 'Suzuki Connect', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
      tata_connect: { label: 'Tata Connect', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      tesla_api: { label: 'Tesla API', color: 'bg-red-600/20 text-red-400 border-red-600/30' },
      none: { label: 'Not Connected', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    };
    return badges[provider] || badges.none;
  };

  const getCommandIcon = (commandType) => {
    const icons = {
      precool: Droplets,
      preheat: Thermometer,
      start: Power,
      stop: Power,
      lock: Lock,
      unlock: Unlock,
      dashcam_on: Camera,
      dashcam_off: Camera,
      horn: Zap,
      lights: Zap,
    };
    return icons[commandType] || Zap;
  };

  const isExecuting = executeCommandMutation.isPending;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 backdrop-blur-md bg-blue-300/10 border border-blue-300/30 rounded-full px-4 py-2 mb-6">
            <Droplets className="w-4 h-4 text-blue-300" />
            <span className="text-blue-300 text-sm font-medium">Remote Vehicle Control</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-blue-300 bg-clip-text text-transparent">
              CarOps Control
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Control your vehicle from anywhere. Pre-cool, start remotely, activate dashcam, and more.
          </p>
        </motion.div>

        {/* Vehicle Selector */}
        {vehicles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <GlassCard className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-400 mb-3">Selected Vehicle</p>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {vehicles.map((vehicle) => (
                      <button
                        key={vehicle.id}
                        onClick={() => setSelectedVehicle(vehicle)}
                        className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                          selectedVehicle?.id === vehicle.id
                            ? "bg-blue-300/20 text-blue-300 border border-blue-300/30"
                            : "bg-white/5 text-gray-300 hover:bg-white/10"
                        }`}
                      >
                        {vehicle.make} {vehicle.model}
                      </button>
                    ))}
                  </div>
                </div>
                {selectedVehicle && (
                  <div className="text-right">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getProviderBadge(selectedVehicle.api_provider).color}`}>
                      <div className="w-2 h-2 rounded-full bg-current" />
                      <span className="text-xs font-medium">
                        {getProviderBadge(selectedVehicle.api_provider).label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {selectedVehicle.license_plate} • {selectedVehicle.mileage.toLocaleString()} mi
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Control Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Climate Control */}
            <GlassCard className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Thermometer className="w-6 h-6 text-blue-300" />
                Climate Control
              </h2>
              
              <div className="space-y-4">
                {/* Temperature Slider */}
                <div className="backdrop-blur-md bg-white/5 border border-blue-300/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400">Target Temperature</span>
                    <span className="text-2xl font-bold text-blue-300">{targetTemp}°F</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="85"
                    value={targetTemp}
                    onChange={(e) => setTargetTemp(Number(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-300"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <GlassButton
                    onClick={() => handleCommand('precool', { temperature: targetTemp })}
                    disabled={isExecuting}
                    icon={isExecuting ? Loader2 : Droplets}
                    className={isExecuting ? 'opacity-50' : ''}
                  >
                    {isExecuting ? 'Executing...' : 'Pre-Cool Cabin'}
                  </GlassButton>
                  <GlassButton
                    onClick={() => handleCommand('preheat', { temperature: targetTemp })}
                    disabled={isExecuting}
                    variant="secondary"
                    icon={isExecuting ? Loader2 : Thermometer}
                    className={isExecuting ? 'opacity-50' : ''}
                  >
                    {isExecuting ? 'Executing...' : 'Pre-Heat Cabin'}
                  </GlassButton>
                </div>
              </div>
            </GlassCard>

            {/* Engine Control */}
            <GlassCard className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Power className="w-6 h-6 text-yellow-300" />
                Engine Control
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <GlassButton
                  onClick={() => handleCommand('start')}
                  disabled={isExecuting}
                  icon={isExecuting ? Loader2 : Power}
                  className={`${isExecuting ? 'opacity-50' : ''}`}
                >
                  {isExecuting ? 'Executing...' : 'Start Engine'}
                </GlassButton>
                <GlassButton
                  onClick={() => handleCommand('stop')}
                  disabled={isExecuting}
                  variant="secondary"
                  icon={isExecuting ? Loader2 : Power}
                  className={`${isExecuting ? 'opacity-50' : ''} border-red-500/30 text-red-400 hover:bg-red-500/10`}
                >
                  {isExecuting ? 'Executing...' : 'Stop Engine'}
                </GlassButton>
              </div>
            </GlassCard>

            {/* Security & Dash Cam */}
            <GlassCard className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Camera className="w-6 h-6 text-purple-300" />
                Security & Monitoring
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <GlassButton
                  onClick={() => handleCommand('lock')}
                  disabled={isExecuting}
                  icon={isExecuting ? Loader2 : Lock}
                  className={isExecuting ? 'opacity-50' : ''}
                >
                  {isExecuting ? 'Executing...' : 'Lock Doors'}
                </GlassButton>
                <GlassButton
                  onClick={() => handleCommand('unlock')}
                  disabled={isExecuting}
                  variant="secondary"
                  icon={isExecuting ? Loader2 : Unlock}
                  className={isExecuting ? 'opacity-50' : ''}
                >
                  {isExecuting ? 'Executing...' : 'Unlock Doors'}
                </GlassButton>
                <GlassButton
                  onClick={() => handleCommand('dashcam_on', { mode: 'parking', duration: 480 })}
                  disabled={isExecuting}
                  icon={isExecuting ? Loader2 : Camera}
                  className={isExecuting ? 'opacity-50' : ''}
                >
                  {isExecuting ? 'Executing...' : 'Activate Dash Cam'}
                </GlassButton>
                <GlassButton
                  onClick={() => handleCommand('dashcam_off')}
                  disabled={isExecuting}
                  variant="secondary"
                  icon={isExecuting ? Loader2 : Camera}
                  className={isExecuting ? 'opacity-50' : ''}
                >
                  {isExecuting ? 'Executing...' : 'Deactivate Dash Cam'}
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>

          {/* Command History */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="p-6 sticky top-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                Recent Commands
              </h2>
              
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {commandsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 text-gray-500 animate-spin mx-auto" />
                    <p className="text-gray-500 text-sm mt-2">Loading...</p>
                  </div>
                ) : recentCommands.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No commands yet</p>
                  </div>
                ) : (
                  recentCommands.map((cmd) => {
                    const Icon = getCommandIcon(cmd.command_type);
                    return (
                      <div
                        key={cmd.id}
                        className="backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-gray-400" />
                            <span className="text-white font-medium capitalize">
                              {cmd.command_type.replace('_', ' ')}
                            </span>
                          </div>
                          {cmd.status === 'success' ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : cmd.status === 'failed' ? (
                            <XCircle className="w-4 h-4 text-red-400" />
                          ) : (
                            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {format(new Date(cmd.executed_at), "MMM d, h:mm a")}
                        </p>
                        {cmd.error_message && (
                          <p className="text-xs text-red-400 mt-2">{cmd.error_message}</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* API Integrations Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <GlassCard className="p-8">
            <h3 className="text-2xl font-bold text-white mb-6">Supported Integrations</h3>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { name: 'Smartcar', description: 'Universal car API for 30+ brands', color: 'blue' },
                { name: 'Suzuki Connect', description: 'Official Suzuki telematics', color: 'red' },
                { name: 'Tata Connect', description: 'Tata Motors connected services', color: 'purple' },
                { name: 'Tesla API', description: 'Native Tesla vehicle control', color: 'red' },
              ].map((integration, idx) => (
                <div key={idx}>
                  <div className={`w-12 h-12 rounded-xl bg-${integration.color}-500/20 border border-${integration.color}-500/30 flex items-center justify-center mb-3`}>
                    <Zap className={`w-6 h-6 text-${integration.color}-400`} />
                  </div>
                  <h4 className="text-white font-semibold mb-1">{integration.name}</h4>
                  <p className="text-gray-400 text-sm">{integration.description}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}