# TradeBlok - Trading Discipline Enforcement App

A comprehensive trading discipline web application that automatically enforces trading rules by integrating with MetaApi to monitor and close rule-violating trades in real-time.

## 🎯 Features

### 🔐 **User Authentication**
- Secure user registration and login system
- User profiles with trading preferences
- Session management with Supabase Auth

### 📊 **Trading Plan Management**
- Configure maximum trades per day
- Set risk percentage limits per trade
- Define allowed trading symbols
- Set trading session hours
- Configure daily loss limits

### 🔌 **MT5 Account Integration**
- Connect MetaTrader 5 accounts via MetaApi
- Real-time connection testing
- Secure credential management
- Account deployment and monitoring

### 🚨 **Real-time Trade Monitoring**
- Live trade streaming and analysis
- Automatic rule violation detection
- Instant position closing for rule breaches
- Comprehensive violation tracking

### 📱 **Interactive Dashboard**
- Real-time trading statistics
- Performance metrics and P&L tracking
- Connection status monitoring
- Trade monitoring controls

### 📖 **Trading Journal**
- Complete trade history with filtering
- Rule compliance tracking
- Violation details and auto-close reasons
- Export capabilities for analysis

## 🚀 **How It Works**

1. **Create Account**: Register and set up your trading profile
2. **Define Rules**: Configure your trading discipline parameters
3. **Connect MT5**: Link your MetaTrader 5 account via MetaApi
4. **Start Monitoring**: Enable real-time trade monitoring
5. **Automatic Enforcement**: System closes rule-violating trades instantly

## 🛠 **Technology Stack**

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **Trading API**: MetaApi for MT5 integration
- **UI Components**: shadcn/ui
- **Build Tool**: Vite

## 📋 **Database Schema**

### Tables:
- `profiles` - User profile information
- `trading_plans` - User-defined trading rules
- `mt5_accounts` - MT5 account connections
- `trades` - Complete trade history with compliance data

## 🔧 **Setup & Installation**

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd tradeblok
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   - Configure Supabase project
   - Add MetaApi token to Supabase secrets
   - Set up database schema

4. **Run development server**
   ```bash
   npm run dev
   ```

## 🔐 **Security Features**

- Row Level Security (RLS) for all database operations
- Encrypted credential storage
- Secure API token management
- User-specific data isolation

## 📊 **Monitoring & Compliance**

The system continuously monitors trades against your configured rules:
- **Session Time Violations**: Trades outside defined hours
- **Symbol Restrictions**: Unauthorized trading symbols
- **Daily Trade Limits**: Exceeding maximum daily trades
- **Daily Loss Limits**: Breach of daily loss thresholds
- **Risk Management**: Per-trade risk percentage violations

## 🚀 **Deployment**

Deploy easily through [Lovable](https://lovable.dev/projects/38eefd03-6222-4f24-80be-f5d91ad49723) with one-click publishing.

## 📞 **Support**

For questions and support, visit the [Lovable Documentation](https://docs.lovable.dev).

---

**Built with ❤️ using Lovable - The AI-powered web development platform**
