import React, { useState, useEffect, useRef } from 'react';
import { Sprout, Cloud, TrendingUp, BookOpen, MessageCircle, Languages } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Profile from './Profile';

const Dashboard = () => {
  const { user } = useAuth();
  const { t, language, setLanguage, supportedLanguages } = useLanguage();
  const [weatherData, setWeatherData] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    if (user?.isProfileComplete) {
      fetchWeatherData();
      fetchMarketData();
    }
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchWeatherData = async () => {
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(user.location || 'Hyderabad')}&count=1&language=en&format=json`
      );
      const geoJson = await geoRes.json();
      const place = geoJson?.results?.[0];
      if (!place) throw new Error('Could not resolve location to coordinates');

      const { latitude, longitude, name: placeName, admin1, country } = place;

      const wxRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`
      );
      const wx = await wxRes.json();

      const formatted = {
        locationLabel: [placeName, admin1, country].filter(Boolean).join(', '),
        current: {
          temperatureC: wx?.current_weather?.temperature ?? null,
          windSpeedKph: wx?.current_weather?.windspeed ?? null,
          windDirectionDeg: wx?.current_weather?.winddirection ?? null,
          weatherCode: wx?.current_weather?.weathercode ?? null,
          time: wx?.current_weather?.time ?? null,
        },
        daily: {
          dates: wx?.daily?.time ?? [],
          maxC: wx?.daily?.temperature_2m_max ?? [],
          minC: wx?.daily?.temperature_2m_min ?? [],
          precipitationMm: wx?.daily?.precipitation_sum ?? [],
        },
      };

      setWeatherData(formatted);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setWeatherData({ error: true });
    }
  };

  const fetchMarketData = async () => {
    try {
      const res = await fetch(
        `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b&format=json&limit=20`
      );
      const data = await res.json();

      if (!data.records || data.records.length === 0) {
        throw new Error("No records returned");
      }

      const commodities = data.records.slice(0, 6).map(r => ({
        name: r.commodity,
        unit: '₹/quintal',
        price: Number(r.modal_price),
        min: Number(r.min_price),
        max: Number(r.max_price),
        market: r.market,
        state: r.state,
      }));

      setMarketData({
        locationLabel: `${user.location}, India`,
        lastUpdate: new Date().toISOString(),
        commodities,
      });
    } catch (error) {
      console.error('Error fetching mandi prices:', error);
      setMarketData({ error: true });
    }
  };

  if (!user?.isProfileComplete) return <Profile />;

  const quickActions = [
    { icon: Sprout, label: t('getCropAdvice'), path: '/crop-advice', color: 'bg-green-500' },
    { icon: Cloud, label: t('weatherAlerts'), path: '/weather', color: 'bg-blue-500' },
    { icon: TrendingUp, label: t('marketPrices'), path: '/market-prices', color: 'bg-purple-500' },
    { icon: BookOpen, label: t('learningHub'), path: '/learning-hub', color: 'bg-orange-500' },
    { icon: MessageCircle, label: t('askAiHelper'), path: '/chatbot', color: 'bg-indigo-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('welcomeBack')}, {user.name}!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {user.location} • {user.farmSize} {t('farmSize').includes('acres') ? 'acres' : 'एकड़'} • {user.soilType} {t('soilType').includes('Soil')}
          </p>
        </div>

        {/* Language Dropdown */}
        <div className="relative inline-block text-left" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <Languages className="h-4 w-4 mr-2" />
            {supportedLanguages.find(l => l.code === language)?.label || 'Language'}
            <svg
              className="ml-2 -mr-1 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.584l3.71-4.353a.75.75 0 011.14.976l-4.25 5a.75.75 0 01-1.14 0l-4.25-5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
              <div className="py-1">
                {supportedLanguages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code); setDropdownOpen(false); }}
                    className={`block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      lang.code === language ? 'font-semibold bg-gray-200 dark:bg-gray-700' : ''
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {quickActions.map(({ icon: Icon, label, path, color }) => (
          <a key={path} href={path} className="card hover:shadow-xl transition-shadow cursor-pointer text-center">
            <div className={`${color} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
          </a>
        ))}
      </div>

      {/* Weather & Market */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Weather Card */}
        <div className="card">
          <div className="flex items-center mb-4">
            <Cloud className="h-6 w-6 text-blue-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('weatherUpdate')}</h2>
          </div>
          {weatherData ? (
            weatherData.error ? (
              <div className="text-sm text-red-600 dark:text-red-400">
                Failed to load weather. Please try again later.
              </div>
            ) : (
              <div className="text-sm text-gray-700 dark:text-gray-200">
                <div className="mb-3">
                  <p className="font-medium">{weatherData.locationLabel}</p>
                  {weatherData.current.temperatureC !== null && (
                    <p>
                      Now: <span className="font-semibold">{Math.round(weatherData.current.temperatureC)}°C</span> • Wind {Math.round(weatherData.current.windSpeedKph)} km/h
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {weatherData.daily.dates.slice(0, 3).map((dateStr, idx) => (
                    <div key={dateStr} className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <p className="text-xs text-gray-500 dark:text-gray-300 mb-1">{new Date(dateStr).toLocaleDateString()}</p>
                      <p className="text-sm">Max {Math.round(weatherData.daily.maxC[idx])}°C</p>
                      <p className="text-sm">Min {Math.round(weatherData.daily.minC[idx])}°C</p>
                      <p className="text-xs text-gray-500 dark:text-gray-300">Rain {Math.round(weatherData.daily.precipitationMm[idx])} mm</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          )}
        </div>

        {/* Market Card */}
        <div className="card">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-6 w-6 text-purple-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('marketPrices')}</h2>
          </div>
          {marketData ? (
            marketData.error ? (
              <div className="text-sm text-red-600 dark:text-red-400">
                Failed to load market prices. Please try again later.
              </div>
            ) : (
              <div className="text-sm text-gray-700 dark:text-gray-200">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-medium">{marketData.locationLabel}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-300">Updated {new Date(marketData.lastUpdate).toLocaleTimeString()}</p>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {marketData.commodities.map(item => (
                    <div key={item.name + item.market} className="py-2 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-300">{item.market}, {item.state}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{item.price.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-500">Min {item.min} / Max {item.max}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
