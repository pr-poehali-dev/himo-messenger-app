import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

interface User {
  id: string;
  username: string;
  custom_id: string;
  avatar_url?: string;
  him_coins: number;
  is_premium: boolean;
  is_verified: boolean;
  is_admin: boolean;
  last_seen: string;
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  username: string;
  custom_id: string;
  is_premium: boolean;
  is_verified: boolean;
}

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('chats');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '' });
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('him_token');
    if (token) {
      verifyToken(token);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch('https://functions.poehali.dev/b6e551f3-09a6-4094-94a4-02369dad1083', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        setIsAuthenticated(true);
        loadChats();
      } else {
        localStorage.removeItem('him_token');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('him_token');
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/b6e551f3-09a6-4094-94a4-02369dad1083', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          username: loginForm.username,
          password: loginForm.password
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('him_token', data.token);
        setCurrentUser(data.user);
        setIsAuthenticated(true);
        setLoginForm({ username: '', password: '' });
        loadChats();
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (error) {
      alert('Connection error');
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/b6e551f3-09a6-4094-94a4-02369dad1083', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('him_token', data.token);
        setCurrentUser(data.user);
        setIsAuthenticated(true);
        setRegisterForm({ username: '', email: '', password: '' });
        loadChats();
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch (error) {
      alert('Connection error');
    }
    setLoading(false);
  };

  const loadChats = async () => {
    // Demo chats for now
    setChats([
      {
        id: 'demo-chat-1',
        name: 'HIM Support',
        lastMessage: 'Welcome to HIM Messenger!',
        timestamp: '14:30',
        unread: 1
      }
    ]);
  };

  const loadMessages = async (chatId: string) => {
    try {
      const response = await fetch(`https://functions.poehali.dev/df260030-42fc-4321-8aa6-e1dc73c50b2c?chat_id=${chatId}`);
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !currentUser) return;

    try {
      const response = await fetch('https://functions.poehali.dev/df260030-42fc-4321-8aa6-e1dc73c50b2c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          chat_id: selectedChat.id,
          sender_id: currentUser.id,
          content: newMessage
        })
      });

      if (response.ok) {
        setNewMessage('');
        loadMessages(selectedChat.id);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleChatClick = (chat: Chat) => {
    setSelectedChat(chat);
    loadMessages(chat.id);
  };

  const handleDailyBonus = () => {
    if (currentUser) {
      setCurrentUser(prev => prev ? ({
        ...prev,
        him_coins: prev.him_coins + 100
      }) : null);
    }
  };

  const handleBuyPremium = () => {
    if (currentUser && currentUser.him_coins >= 500) {
      setCurrentUser(prev => prev ? ({
        ...prev,
        him_coins: prev.him_coins - 500,
        is_premium: true
      }) : null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('him_token');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSelectedChat(null);
    setMessages([]);
    setChats([]);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon name="MessageCircle" size={32} className="text-white" />
            </div>
            <CardTitle className="text-2xl">HIM Messenger</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={isLoginMode ? 'login' : 'register'} onValueChange={(v) => setIsLoginMode(v === 'login')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Вход</TabsTrigger>
                <TabsTrigger value="register">Регистрация</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                <div className="space-y-3">
                  <Input
                    placeholder="Имя пользователя"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm(prev => ({...prev, username: e.target.value}))}
                  />
                  <Input
                    type="password"
                    placeholder="Пароль"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({...prev, password: e.target.value}))}
                  />
                  <Button 
                    onClick={handleLogin} 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? 'Вход...' : 'Войти'}
                  </Button>
                </div>
                
                <Alert>
                  <AlertDescription>
                    Админ: <strong>Himo</strong> / <strong>Satoru1212</strong>
                  </AlertDescription>
                </Alert>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4">
                <div className="space-y-3">
                  <Input
                    placeholder="Имя пользователя"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm(prev => ({...prev, username: e.target.value}))}
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm(prev => ({...prev, email: e.target.value}))}
                  />
                  <Input
                    type="password"
                    placeholder="Пароль (минимум 6 символов)"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm(prev => ({...prev, password: e.target.value}))}
                  />
                  <Button 
                    onClick={handleRegister} 
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedChat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
        {/* Chat Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedChat(null)}>
              <Icon name="ArrowLeft" size={20} />
            </Button>
            <Avatar>
              <AvatarFallback className="bg-indigo-100 text-indigo-600">
                {selectedChat.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold">{selectedChat.name}</h3>
              <p className="text-sm text-gray-500">онлайн</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="max-w-md mx-auto bg-white min-h-screen pb-20">
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <Icon name="MessageCircle" size={48} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">Начните общение!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div 
                  key={message.id}
                  className={`flex ${message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    message.sender_id === currentUser?.id 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {message.sender_id !== currentUser?.id && (
                      <div className="flex items-center space-x-1 mb-1">
                        <span className="text-xs font-medium">{message.username}</span>
                        {message.is_premium && <Icon name="Crown" size={12} className="text-yellow-500" />}
                        {message.is_verified && <Icon name="CheckCircle" size={12} className="text-blue-500" />}
                      </div>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender_id === currentUser?.id ? 'text-indigo-200' : 'text-gray-500'
                    }`}>
                      {new Date(message.created_at).toLocaleTimeString('ru-RU', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t p-4">
            <div className="flex items-center space-x-2">
              <Textarea
                placeholder="Введите сообщение..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 min-h-[40px] max-h-32 resize-none"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button 
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                size="sm"
                className="shrink-0"
              >
                <Icon name="Send" size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Icon name="MessageCircle" size={20} className="text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">HIM Messenger</h1>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-yellow-100 px-2 py-1 rounded-full">
              <Icon name="Coins" size={14} className="text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">{currentUser?.him_coins}</span>
            </div>
            {currentUser?.is_premium && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                <Icon name="Crown" size={12} />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <Icon name="LogOut" size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto bg-white min-h-screen">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <div className="px-4 py-4">
            <TabsContent value="chats" className="mt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Чаты</h2>
                  <Button size="sm" variant="outline">
                    <Icon name="Plus" size={16} />
                  </Button>
                </div>
                
                {chats.map((chat) => (
                  <Card 
                    key={chat.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleChatClick(chat)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-indigo-100 text-indigo-600">
                            {chat.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900">{chat.name}</p>
                            <span className="text-xs text-gray-500">{chat.timestamp}</span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                        </div>
                        {chat.unread > 0 && (
                          <Badge className="bg-indigo-600">{chat.unread}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="profile" className="mt-0">
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-16 h-16">
                        <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xl">
                          {currentUser?.username[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold">{currentUser?.username}</h3>
                          {currentUser?.is_premium && (
                            <Icon name="Crown" size={16} className="text-yellow-500" />
                          )}
                          {currentUser?.is_admin && (
                            <Badge variant="secondary">Admin</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">ID: {currentUser?.custom_id}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <Icon name="Coins" size={14} className="text-yellow-600" />
                          <span className="text-sm font-medium">{currentUser?.him_coins} HimCoins</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">HimCoins</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button onClick={handleDailyBonus} className="w-full" variant="outline">
                      <Icon name="Gift" size={16} className="mr-2" />
                      Получить ежедневный бонус (+100)
                    </Button>
                    
                    {!currentUser?.is_premium && (
                      <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Icon name="Crown" size={16} className="text-yellow-600" />
                          <span className="font-medium text-yellow-800">HIM Messenger+</span>
                        </div>
                        <p className="text-sm text-yellow-700 mb-3">
                          Золотой значок, изменение ID, приоритетная поддержка
                        </p>
                        <Button 
                          onClick={handleBuyPremium}
                          disabled={!currentUser || currentUser.him_coins < 500}
                          className="w-full bg-yellow-600 hover:bg-yellow-700"
                        >
                          Купить за 500 HimCoins
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {currentUser?.is_admin && (
              <TabsContent value="admin" className="mt-0">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center space-x-2">
                        <Icon name="Shield" size={16} />
                        <span>Админ панель</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm">
                          <Icon name="Users" size={14} className="mr-1" />
                          Пользователи
                        </Button>
                        <Button variant="outline" size="sm">
                          <Icon name="Flag" size={14} className="mr-1" />
                          Жалобы
                        </Button>
                        <Button variant="outline" size="sm">
                          <Icon name="CheckCircle" size={14} className="mr-1" />
                          Верификация
                        </Button>
                        <Button variant="outline" size="sm">
                          <Icon name="Ban" size={14} className="mr-1" />
                          Банхаммер
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}

            <TabsContent value="settings" className="mt-0">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Настройки</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Icon name="Bell" size={16} className="mr-2" />
                      Уведомления
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Icon name="Shield" size={16} className="mr-2" />
                      Приватность
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Icon name="Palette" size={16} className="mr-2" />
                      Тема
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Icon name="HelpCircle" size={16} className="mr-2" />
                      Помощь
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-red-600 hover:text-red-700"
                      onClick={handleLogout}
                    >
                      <Icon name="LogOut" size={16} className="mr-2" />
                      Выйти
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>

          {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t shadow-lg">
            <TabsList className="grid grid-cols-4 w-full h-14 bg-white">
              <TabsTrigger value="chats" className="flex flex-col space-y-1 data-[state=active]:bg-indigo-50">
                <Icon name="MessageCircle" size={20} />
                <span className="text-xs">Чаты</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex flex-col space-y-1 data-[state=active]:bg-indigo-50">
                <Icon name="User" size={20} />
                <span className="text-xs">Профиль</span>
              </TabsTrigger>
              {currentUser?.is_admin && (
                <TabsTrigger value="admin" className="flex flex-col space-y-1 data-[state=active]:bg-indigo-50">
                  <Icon name="Shield" size={20} />
                  <span className="text-xs">Админка</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="settings" className="flex flex-col space-y-1 data-[state=active]:bg-indigo-50">
                <Icon name="Settings" size={20} />
                <span className="text-xs">Настройки</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;