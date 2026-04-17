import { BrowserRouter as Router, Routes, Route } from "react-router";
import './App.css'
import Home from './pages/Home'
import Test from './pages/Test'
import MyEvent from "./helper/MyEvent";
import LocalStorage from "./helper/LocalStorage";
import GeneralHelper from "./helper/GeneralHelper";
import { useContext, useEffect, useState } from "react";
import { AppContext } from './helper/Context';
import i18n from "./helper/I18n";
import LoadingSpinner from "./components/LoadingSpinner";
import NavBar from "./components/NavBar";
import Database from "./pages/Database";
import Template from "./pages/Template";
import Map from "./pages/Map";

function App() {
  const { setContextKey, ContextValues } = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    setContextKey("userRole", "admin");
    setContextKey("language", (navigator.language || (navigator as any).userLanguage || 'en').split('-')[0] || "en");
    setContextKey("theme", document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
    if (!ContextValues?.uuid) {
      const fromStorage = LocalStorage.LoadItem<string>('uuid');
      const uuid = fromStorage ?? GeneralHelper.generateUUID();
      if (!fromStorage) LocalStorage.safeItem('uuid', uuid);
      setContextKey("uuid", uuid);
    }
    const off = MyEvent.subscribe('loading', (e: any) => {
      const payload = (e as CustomEvent).detail;
      setIsLoading(!!payload?.status);
    });
    console.log("App started");
    return () => {
      if (typeof off === 'function') {
        off();
      } else {
        MyEvent.unsubscribe('loading');
      }
      console.log("App stopped");
    }
  }, []);

  var navs = [
    { path: "/map", element: <Map />, name: i18n('Pages.Map.PageName'), useInNavBar: true },
    { path: "/template", element: <Template />, name: i18n('Pages.Template.PageName'), useInNavBar: true },
    { path: "/database", element: <Database />, name: i18n('Pages.Database.PageName'), useInNavBar: true },
    { path: "/test", element: <Test />, name: i18n('Pages.Test.PageName'), useInNavBar: true },
    { path: "/home", element: <Home />, name: i18n('Pages.Home.PageName'), useInNavBar: true },
    { path: "/", element: <Home />, name: i18n('Pages.Dashboard.PageName'), useInNavBar: false },
    { path: "*", element: <Home />, name: i18n('Pages.Dashboard.PageName'), useInNavBar: false },
    { path: "", element: <Home />, name: i18n('Pages.Dashboard.PageName'), useInNavBar: false },
  ]

  return (
    <Router>
      <NavBar navs={navs.reverse()} />
      {isLoading && <LoadingSpinner />}
      <div style={{ display: "flex", width: "100%", height: "100%", alignContent: "center", justifyContent: "center", alignItems: "center" }}>
        {/* <Sidebar /> */}
        {/* <div style={{ marginLeft: "10vw", padding: "2rem", width: "90vw" }}> */}
        <Routes>
          {navs.map((nav, i) => {
            return <Route key={nav.name + i} path={nav.path} element={nav.element} />
          })}
        </Routes>
      </div>
      {/* </div> */}
    </Router>
  )
}

export default App
