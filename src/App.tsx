import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ShoppingCart, Phone, MapPin, CreditCard, MessageCircle, Crown, Star, Sparkles, Plus, Minus, Trash2 } from 'lucide-react';

interface CupSize {
  id: string;
  name: string;
  volume: string;
  price: number;
  description: string;
  highlight?: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  price?: number;
}

interface Category {
  id: string;
  name: string;
  items: MenuItem[];
  maxSelections: number;
  hasExtraPrice?: boolean;
  required?: boolean;
}

interface Cup {
  id: string;
  cupSize: CupSize;
  selections: { [categoryId: string]: MenuItem[] };
}

interface Order {
  cups: Cup[];
  customerInfo: {
    name: string;
    address: string;
    paymentMethod: string;
    needsChange: string;
  };
}

interface Config {
  whatsapp: string;
  cupSizes: CupSize[];
  categories: Category[];
}

function App() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState('cover');
  const [order, setOrder] = useState<Order>({
    cups: [],
    customerInfo: {
      name: '',
      address: '',
      paymentMethod: '',
      needsChange: ''
    }
  });
  const [currentCupIndex, setCurrentCupIndex] = useState(0);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/config.json');
        const configData = await response.json();
        setConfig(configData);
      } catch (error) {
        console.error('Erro ao carregar configuração:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 mx-auto mb-4 text-yellow-400 animate-pulse" />
          <p className="text-white text-xl">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <p className="text-white text-xl">Erro ao carregar configuração</p>
        </div>
      </div>
    );
  }

  const calculateCupTotal = (cup: Cup) => {
    let total = cup.cupSize.price;
    
    Object.values(cup.selections).forEach(items => {
      items.forEach(item => {
        if (item.price) {
          total += item.price;
        }
      });
    });
    
    return total;
  };

  const calculateOrderTotal = () => {
    return order.cups.reduce((total, cup) => total + calculateCupTotal(cup), 0);
  };

  const addNewCup = (cupSize: CupSize) => {
    const newCup: Cup = {
      id: Date.now().toString(),
      cupSize,
      selections: {}
    };
    
    setOrder(prev => ({
      ...prev,
      cups: [...prev.cups, newCup]
    }));
    
    setCurrentCupIndex(order.cups.length);
    setCurrentSection('assembly');
  };

  const removeCup = (cupIndex: number) => {
    setOrder(prev => ({
      ...prev,
      cups: prev.cups.filter((_, index) => index !== cupIndex)
    }));
    
    if (currentCupIndex >= order.cups.length - 1) {
      setCurrentCupIndex(Math.max(0, order.cups.length - 2));
    }
    
    if (order.cups.length === 1) {
      setCurrentSection('sizes');
    }
  };

  const toggleSelection = (categoryId: string, item: MenuItem) => {
    const category = config.categories.find(cat => cat.id === categoryId);
    if (!category || currentCupIndex >= order.cups.length) return;

    const currentCup = order.cups[currentCupIndex];
    const currentSelections = currentCup.selections[categoryId] || [];
    const isSelected = currentSelections.some(selected => selected.id === item.id);

    if (isSelected) {
      // Remove item
      setOrder(prev => ({
        ...prev,
        cups: prev.cups.map((cup, index) => 
          index === currentCupIndex 
            ? {
                ...cup,
                selections: {
                  ...cup.selections,
                  [categoryId]: currentSelections.filter(selected => selected.id !== item.id)
                }
              }
            : cup
        )
      }));
    } else {
      // Add item if under limit
      if (currentSelections.length < category.maxSelections) {
        setOrder(prev => ({
          ...prev,
          cups: prev.cups.map((cup, index) => 
            index === currentCupIndex 
              ? {
                  ...cup,
                  selections: {
                    ...cup.selections,
                    [categoryId]: [...currentSelections, item]
                  }
                }
              : cup
          )
        }));
      }
    }
  };

  const isCurrentCupValid = () => {
    if (currentCupIndex >= order.cups.length) return false;
    
    const currentCup = order.cups[currentCupIndex];
    const acaiSorveteSelections = currentCup.selections['acai-sorvete'] || [];
    
    return acaiSorveteSelections.length >= 1;
  };

  const canProceedToCheckout = () => {
    return order.cups.length > 0 && order.cups.every(cup => {
      const acaiSorveteSelections = cup.selections['acai-sorvete'] || [];
      return acaiSorveteSelections.length >= 1;
    });
  };

  const generateWhatsAppMessage = () => {
    if (order.cups.length === 0) return '';

    let message = `🍨 *PEDIDO REI GELADO* 🍨\n\n`;
    
    order.cups.forEach((cup, index) => {
      message += `👑 *COPO ${index + 1} - ${cup.cupSize.name}* - R$ ${cup.cupSize.price.toFixed(2)}\n`;

      Object.entries(cup.selections).forEach(([categoryId, items]) => {
        if (items.length > 0) {
          const category = config.categories.find(cat => cat.id === categoryId);
          message += `*${category?.name}:*\n`;
          items.forEach(item => {
            message += `• ${item.name}${item.price ? ` (+R$ ${item.price.toFixed(2)})` : ''}\n`;
          });
        }
      });
      
      message += `*Subtotal Copo ${index + 1}: R$ ${calculateCupTotal(cup).toFixed(2)}*\n\n`;
    });

    message += `💰 *TOTAL GERAL: R$ ${calculateOrderTotal().toFixed(2)}*\n\n`;
    message += `📋 *DADOS DO CLIENTE:*\n`;
    message += `Nome: ${order.customerInfo.name}\n`;
    message += `Endereço: ${order.customerInfo.address}\n`;
    message += `Pagamento: ${order.customerInfo.paymentMethod}\n`;
    if (order.customerInfo.needsChange) {
      message += `Troco: ${order.customerInfo.needsChange}\n`;
    }

    return encodeURIComponent(message);
  };

  const sendToWhatsApp = () => {
    const message = generateWhatsAppMessage();
    window.open(`https://wa.me/${config.whatsapp}?text=${message}`, '_blank');
  };

  const renderCover = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 flex flex-col items-center justify-center text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-blue-400/10"></div>
      <div className="absolute top-20 left-20 w-32 h-32 bg-yellow-400/20 rounded-full blur-xl"></div>
      <div className="absolute bottom-32 right-16 w-48 h-48 bg-purple-400/20 rounded-full blur-xl"></div>
      
      <div className="text-center z-10 px-4 max-w-4xl">
        <Crown className="w-24 h-24 mx-auto mb-8 text-yellow-400 animate-pulse" />
        
        <h1 className="text-6xl md:text-8xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
          REI GELADO
        </h1>
        <p className="text-2xl md:text-3xl font-light mb-8 text-purple-200">
          Sorvetes e Açaí
        </p>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-12 border border-white/20">
          <h2 className="text-3xl font-bold text-yellow-400 mb-4">
            Faça do seu jeito!
          </h2>
          <p className="text-lg leading-relaxed mb-4">
            Você é o rei da sua própria criação! Escolha quantos copos quiser e monte cada açaí do seu jeito: 
            frutas, guloseimas, caldas, coberturas e muito mais!
          </p>
          <p className="text-lg leading-relaxed">
            Sinta-se livre para criar a combinação perfeita com os adicionais que você ama. 
            Aqui, o sabor é do seu jeito!
          </p>
        </div>
        
        <button
          onClick={() => setCurrentSection('sizes')}
          className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-purple-900 font-bold py-4 px-12 rounded-full text-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          Começar Pedido
        </button>
      </div>
    </div>
  );

  const renderSizes = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-blue-800 py-16 pt-32">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-yellow-400 to-purple-400 bg-clip-text text-transparent">
            {order.cups.length === 0 ? 'Escolha seu Primeiro Copo' : 'Adicionar Novo Copo'}
          </h2>
          <p className="text-xl text-blue-200">Selecione o copo perfeito para sua criação</p>
          
          {order.cups.length > 0 && (
            <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-xl p-4 inline-block">
              <p className="text-white font-semibold">
                Copos no pedido: <span className="text-yellow-400">{order.cups.length}</span>
              </p>
              <p className="text-white font-semibold">
                Total atual: <span className="text-yellow-400">R$ {calculateOrderTotal().toFixed(2)}</span>
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {config.cupSizes.map((cup) => (
            <div
              key={cup.id}
              className={`relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                cup.highlight 
                  ? 'border-yellow-400 shadow-2xl shadow-yellow-400/25' 
                  : 'border-white/20 hover:border-purple-400'
              }`}
              onClick={() => addNewCup(cup)}
            >
              {cup.highlight && (
                <div className="absolute -top-4 -right-4">
                  <Star className="w-8 h-8 text-yellow-400 fill-current" />
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{cup.name}</h3>
                <div className="text-4xl font-bold text-yellow-400 mb-4">
                  R$ {cup.price.toFixed(2)}
                </div>
                <div className="text-purple-200 text-sm font-semibold">
                  {cup.volume}
                </div>
              </div>
              
              <p className="text-white/80 text-center leading-relaxed mb-4">
                {cup.description}
              </p>

              <div className="text-center">
                <div className="bg-gradient-to-r from-yellow-400/20 to-purple-400/20 rounded-lg p-3">
                  <Plus className="w-6 h-6 mx-auto text-yellow-400" />
                  <p className="text-white text-sm font-semibold mt-1">Adicionar Copo</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {order.cups.length > 0 && (
          <div className="text-center mt-12 space-y-4">
            <button
              onClick={() => {
                setCurrentCupIndex(order.cups.length - 1);
                setCurrentSection('assembly');
              }}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold py-4 px-12 rounded-full text-xl transition-all duration-300 transform hover:scale-105 shadow-lg mr-4"
            >
              Montar Último Copo
            </button>
            
            {canProceedToCheckout() && (
              <button
                onClick={() => setCurrentSection('checkout')}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-12 rounded-full text-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Finalizar Pedido
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderAssembly = () => {
    if (order.cups.length === 0) {
      setCurrentSection('sizes');
      return null;
    }

    const currentCup = order.cups[currentCupIndex];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 py-16 pt-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-8">Monte Sua Criação</h2>
            
            {/* Cup Selector */}
            <div className="flex justify-center items-center space-x-2 mb-6">
              <button
                onClick={() => setCurrentCupIndex(Math.max(0, currentCupIndex - 1))}
                disabled={currentCupIndex === 0}
                className="p-2 rounded-full bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
              >
                <ChevronDown className="w-6 h-6 rotate-90" />
              </button>
              
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 min-w-[200px] max-w-[250px]">
                <p className="text-yellow-400 font-bold text-lg">
                  Copo {currentCupIndex + 1} de {order.cups.length}
                </p>
                <p className="text-white font-semibold text-sm">
                  {currentCup.cupSize.name} - R$ {currentCup.cupSize.price.toFixed(2)}
                </p>
                <p className="text-purple-200 text-xs">
                  Subtotal: R$ {calculateCupTotal(currentCup).toFixed(2)}
                </p>
              </div>
              
              <button
                onClick={() => setCurrentCupIndex(Math.min(order.cups.length - 1, currentCupIndex + 1))}
                disabled={currentCupIndex === order.cups.length - 1}
                className="p-2 rounded-full bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
              >
                <ChevronDown className="w-6 h-6 -rotate-90" />
              </button>
              
              <button
                onClick={() => removeCup(currentCupIndex)}
                className="p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Validation Message */}
            {!isCurrentCupValid() && (
              <div className="bg-red-500/20 border border-red-400 rounded-xl p-4 mb-6 max-w-2xl mx-auto">
                <p className="text-red-200 font-semibold">
                  ⚠️ Você deve escolher pelo menos 1 sabor de Açaí e Sorvete para este copo!
                </p>
              </div>
            )}
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {config.categories.map((category) => {
              const currentSelections = currentCup.selections[category.id] || [];
              const isExpanded = expandedCategory === category.id;
              
              return (
                <div key={category.id} className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
                  <button
                    className="w-full p-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors rounded-xl"
                    onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        category.id === 'mega-especiais' ? 'bg-yellow-400' :
                        category.hasExtraPrice ? 'bg-purple-400' : 'bg-blue-400'
                      }`}></div>
                      <h3 className="text-xl font-bold text-white">{category.name}</h3>
                      {category.required && (
                        <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full font-bold">
                          OBRIGATÓRIO
                        </span>
                      )}
                      <span className={`text-sm px-3 py-1 rounded-full ${
                        category.required && currentSelections.length === 0 
                          ? 'bg-red-500/30 text-red-200' 
                          : 'bg-white/20 text-white'
                      }`}>
                        {currentSelections.length}/{category.maxSelections}
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp className="text-white" /> : <ChevronDown className="text-white" />}
                  </button>
                  
                  {isExpanded && (
                    <div className="px-6 pb-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {category.items.map((item) => {
                          const isSelected = currentSelections.some(selected => selected.id === item.id);
                          const canSelect = currentSelections.length < category.maxSelections || isSelected;
                          
                          return (
                            <button
                              key={item.id}
                              className={`p-4 rounded-lg text-left transition-all duration-200 ${
                                isSelected 
                                  ? 'bg-gradient-to-r from-yellow-400/30 to-purple-400/30 border-2 border-yellow-400' 
                                  : canSelect 
                                  ? 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30' 
                                  : 'bg-gray-500/20 border border-gray-500/20 opacity-50 cursor-not-allowed'
                              }`}
                              onClick={() => canSelect && toggleSelection(category.id, item)}
                              disabled={!canSelect}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-white font-medium">{item.name}</span>
                                {item.price && (
                                  <span className="text-yellow-400 font-bold">+R$ {item.price.toFixed(2)}</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12 space-y-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 inline-block mb-8">
              <div className="text-2xl font-bold text-yellow-400 mb-2">
                Total do Pedido: R$ {calculateOrderTotal().toFixed(2)}
              </div>
              <div className="text-white">
                {order.cups.length} copo{order.cups.length > 1 ? 's' : ''} no pedido
              </div>
            </div>
            <br />
            
            <div className="space-x-4">
              <button
                onClick={() => setCurrentSection('sizes')}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Adicionar Mais Copos
              </button>
              
              {canProceedToCheckout() && (
                <button
                  onClick={() => setCurrentSection('checkout')}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-purple-900 font-bold py-4 px-12 rounded-full text-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Finalizar Pedido
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCheckout = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-blue-800 py-16 pt-32">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Finalizar Pedido</h2>
          <p className="text-blue-200">Preencha seus dados para enviar o pedido</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
            <h3 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center">
              <ShoppingCart className="mr-3" />
              Resumo do Pedido
            </h3>
            
            <div className="space-y-6 max-h-96 overflow-y-auto">
              {order.cups.map((cup, cupIndex) => (
                <div key={cup.id} className="border-b border-white/10 pb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-white font-bold text-lg">
                      Copo {cupIndex + 1} - {cup.cupSize.name}
                    </span>
                    <span className="text-yellow-400 font-bold">R$ {cup.cupSize.price.toFixed(2)}</span>
                  </div>
                  
                  {Object.entries(cup.selections).map(([categoryId, items]) => 
                    items.map((item) => (
                      <div key={`${cupIndex}-${categoryId}-${item.id}`} className="flex justify-between items-center py-1 ml-4">
                        <span className="text-white/80 text-sm">{item.name}</span>
                        {item.price && <span className="text-yellow-400 text-sm">+R$ {item.price.toFixed(2)}</span>}
                      </div>
                    ))
                  )}
                  
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/10">
                    <span className="text-white font-semibold">Subtotal Copo {cupIndex + 1}</span>
                    <span className="text-yellow-400 font-bold">R$ {calculateCupTotal(cup).toFixed(2)}</span>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-between items-center py-4 border-t border-white/20 text-xl font-bold">
                <span className="text-white">Total Geral</span>
                <span className="text-yellow-400">R$ {calculateOrderTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
            <h3 className="text-2xl font-bold text-white mb-6">Dados para Entrega</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-white font-semibold mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={order.customerInfo.name}
                  onChange={(e) => setOrder(prev => ({
                    ...prev,
                    customerInfo: { ...prev.customerInfo, name: e.target.value }
                  }))}
                  className="w-full p-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30 transition-colors"
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">
                  <MapPin className="inline mr-2" size={16} />
                  Endereço Completo
                </label>
                <textarea
                  value={order.customerInfo.address}
                  onChange={(e) => setOrder(prev => ({
                    ...prev,
                    customerInfo: { ...prev.customerInfo, address: e.target.value }
                  }))}
                  rows={3}
                  className="w-full p-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30 transition-colors"
                  placeholder="Rua, número, bairro, cidade..."
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">
                  <CreditCard className="inline mr-2" size={16} />
                  Forma de Pagamento
                </label>
                <select
                  value={order.customerInfo.paymentMethod}
                  onChange={(e) => setOrder(prev => ({
                    ...prev,
                    customerInfo: { ...prev.customerInfo, paymentMethod: e.target.value }
                  }))}
                  className="w-full p-4 rounded-lg bg-white/10 border border-white/20 text-white focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30 transition-colors"
                >
                  <option value="">Selecione...</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="PIX">PIX</option>
                </select>
              </div>

              {order.customerInfo.paymentMethod === 'Dinheiro' && (
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Precisa de Troco?
                  </label>
                  <input
                    type="text"
                    value={order.customerInfo.needsChange}
                    onChange={(e) => setOrder(prev => ({
                      ...prev,
                      customerInfo: { ...prev.customerInfo, needsChange: e.target.value }
                    }))}
                    className="w-full p-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30 transition-colors"
                    placeholder="Ex: Troco para R$ 50,00 ou Não precisa de troco"
                  />
                </div>
              )}
            </div>

            <button
              onClick={sendToWhatsApp}
              disabled={!order.customerInfo.name || !order.customerInfo.address || !order.customerInfo.paymentMethod || !canProceedToCheckout()}
              className="w-full mt-8 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-full text-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center"
            >
              <MessageCircle className="mr-3" size={24} />
              Enviar Pedido via WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFooter = () => (
    <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-purple-900 text-white py-16">
      <div className="container mx-auto px-4 text-center">
        <Crown className="w-16 h-16 mx-auto mb-6 text-yellow-400" />
        <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-purple-400 bg-clip-text text-transparent">
          Obrigado por escolher o Rei Gelado!
        </h3>
        <p className="text-xl text-blue-200 mb-8">
          Esperamos vê-lo em breve para mais delícias geladas!
        </p>
        <div className="flex justify-center space-x-2">
          <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
          <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" style={{animationDelay: '0.5s'}} />
          <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" style={{animationDelay: '1s'}} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="font-sans">
      {currentSection === 'cover' && renderCover()}
      {currentSection === 'sizes' && renderSizes()}
      {currentSection === 'assembly' && renderAssembly()}
      {currentSection === 'checkout' && renderCheckout()}
      {currentSection === 'checkout' && renderFooter()}
      
      {/* Navigation Bar */}
      {currentSection !== 'cover' && (
        <div className="fixed top-4 left-4 right-4 z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-full px-6 py-3 flex items-center justify-between border border-white/20">
            <button
              onClick={() => setCurrentSection('cover')}
              className="flex items-center text-white hover:text-yellow-400 transition-colors"
            >
              <Crown className="w-6 h-6 mr-2" />
              <span className="font-bold">Rei Gelado</span>
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="text-white text-sm">
                {order.cups.length} copo{order.cups.length !== 1 ? 's' : ''} | R$ {calculateOrderTotal().toFixed(2)}
              </div>
              
              <button
                onClick={() => setCurrentSection('sizes')}
                className={`px-4 py-2 rounded-full transition-colors ${
                  currentSection === 'sizes' 
                    ? 'bg-yellow-400 text-purple-900 font-bold' 
                    : 'text-white hover:text-yellow-400'
                }`}
              >
                Tamanhos
              </button>
              {order.cups.length > 0 && (
                <button
                  onClick={() => setCurrentSection('assembly')}
                  className={`px-4 py-2 rounded-full transition-colors ${
                    currentSection === 'assembly' 
                      ? 'bg-yellow-400 text-purple-900 font-bold' 
                      : 'text-white hover:text-yellow-400'
                  }`}
                >
                  Montagem
                </button>
              )}
              {canProceedToCheckout() && (
                <button
                  onClick={() => setCurrentSection('checkout')}
                  className={`px-4 py-2 rounded-full transition-colors ${
                    currentSection === 'checkout' 
                      ? 'bg-yellow-400 text-purple-900 font-bold' 
                      : 'text-white hover:text-yellow-400'
                  }`}
                >
                  Finalizar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;