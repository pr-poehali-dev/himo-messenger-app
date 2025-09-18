import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';

interface User {
  id: string;
  username: string;
  avatar: string;
  himCoins: number;
  isPremium: boolean;
  isVerified: boolean;
  lastSeen: string;
  customId?: string;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
}

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

interface Report {
  id: string;
  reporterId: string;
  targetId: string;
  reason: string;
  timestamp: string;
  status: 'pending' | 'resolved';
}

const Index = () => {
  const [activeTab, setActiveTab] = useState('chats');
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'user1',
    username: 'Пользователь',
    avatar: '',
    himCoins: 150,
    isPremium: false,
    isVerified: false,
    lastSeen: 'сейчас онлайн',
    customId: 'USER001'
  });

  const [himoUser] = useState<User>({
    id: 'admin',
    username: 'Himo',
    avatar: '',
    himCoins: 999999,
    isPremium: true,
    isVerified: true,
    lastSeen: 'сейчас онлайн',
    customId: 'HIMO'
  });

  const [users] = useState<User[]>([
    currentUser,
    himoUser,
    {
      id: 'user2',
      username: 'Анна',
      avatar: '',
      himCoins: 250,
      isPremium: true,
      isVerified: false,
      lastSeen: '5 мин назад',
      customId: 'USER002'
    }
  ]);

  const [chats] = useState<Chat[]>([
    {
      id: 'chat1',
      name: 'Himo',
      lastMessage: 'Добро пожаловать в HIM Messenger!',
      timestamp: '14:30',
      unread: 1
    },
    {
      id: 'chat2', 
      name: 'Анна',
      lastMessage: 'Привет! Как дела?',
      timestamp: '13:45',
      unread: 0
    }
  ]);

  const [friends] = useState<User[]>([
    {
      id: 'user2',
      username: 'Анна',
      avatar: '',
      himCoins: 250,
      isPremium: true,
      isVerified: false,
      lastSeen: '5 мин назад',
      customId: 'USER002'
    }
  ]);

  const [reports] = useState<Report[]>([
    {
      id: 'report1',
      reporterId: 'user2',
      targetId: 'user3',
      reason: 'Спам',
      timestamp: '12:30',
      status: 'pending'
    }
  ]);

  const isAdmin = currentUser.id === 'admin';

  const handleDailyBonus = () => {
    setCurrentUser(prev => ({
      ...prev,
      himCoins: prev.himCoins + 100
    }));
  };

  const handleBuyPremium = () => {
    if (currentUser.himCoins >= 500) {
      setCurrentUser(prev => ({
        ...prev,
        himCoins: prev.himCoins - 500,
        isPremium: true
      }));
    }
  };

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
              <span className="text-sm font-medium text-yellow-800">{currentUser.himCoins}</span>
            </div>
            {currentUser.isPremium && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                <Icon name="Crown" size={12} />
              </Badge>
            )}
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
                  <Card key={chat.id} className="hover:shadow-md transition-shadow cursor-pointer">
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

            <TabsContent value="friends" className="mt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Друзья</h2>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Icon name="UserPlus" size={16} />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Добавить друга</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input placeholder="Введите ID пользователя" />
                        <Button className="w-full">Отправить запрос</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {friends.map((friend) => (
                  <Card key={friend.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-indigo-100 text-indigo-600">
                            {friend.username[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900">{friend.username}</p>
                            {friend.isPremium && (
                              <Icon name="Crown" size={14} className="text-yellow-500" />
                            )}
                            {friend.isVerified && (
                              <Icon name="CheckCircle" size={14} className="text-blue-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{friend.lastSeen}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          <Icon name="MessageCircle" size={16} />
                        </Button>
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
                          {currentUser.username[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold">{currentUser.username}</h3>
                          {currentUser.isPremium && (
                            <Icon name="Crown" size={16} className="text-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">ID: {currentUser.customId}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <Icon name="Coins" size={14} className="text-yellow-600" />
                          <span className="text-sm font-medium">{currentUser.himCoins} HimCoins</span>
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
                    
                    {!currentUser.isPremium && (
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
                          disabled={currentUser.himCoins < 500}
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

            {isAdmin && (
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
                          Жалобы ({reports.filter(r => r.status === 'pending').length})
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

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Активные жалобы</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {reports.filter(r => r.status === 'pending').map(report => (
                        <Alert key={report.id} className="mb-3">
                          <Icon name="AlertCircle" size={16} />
                          <AlertDescription>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">
                                Жалоба на пользователя: {report.reason}
                              </span>
                              <div className="space-x-2">
                                <Button size="sm" variant="outline">Рассмотреть</Button>
                              </div>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
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
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>

          {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t shadow-lg">
            <TabsList className="grid grid-cols-5 w-full h-14 bg-white">
              <TabsTrigger value="chats" className="flex flex-col space-y-1 data-[state=active]:bg-indigo-50">
                <Icon name="MessageCircle" size={20} />
                <span className="text-xs">Чаты</span>
              </TabsTrigger>
              <TabsTrigger value="friends" className="flex flex-col space-y-1 data-[state=active]:bg-indigo-50">
                <Icon name="Users" size={20} />
                <span className="text-xs">Друзья</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex flex-col space-y-1 data-[state=active]:bg-indigo-50">
                <Icon name="User" size={20} />
                <span className="text-xs">Профиль</span>
              </TabsTrigger>
              {isAdmin && (
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