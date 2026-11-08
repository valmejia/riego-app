// client/src/App.jsx
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import { useHumedad } from './hooks/useHumedad';

export default function App() {
  const { data, error } = useHumedad('maceta1');

  return (
    <div className="bg-surface text-on-surface font-body-md antialiased min-h-screen">
      <Header />
      <main className="w-full pt-20 bg-surface min-h-[calc(100vh-80px)]">
        {error ? (
          <div className="p-gutter-lg text-error">Error al conectar: {error}</div>
        ) : (
          <Dashboard data={data} />
        )}
      </main>
      <Footer />
    </div>
  );
}