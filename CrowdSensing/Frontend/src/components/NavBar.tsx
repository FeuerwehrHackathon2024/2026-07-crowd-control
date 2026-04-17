import { useState, useEffect, useContext, type JSX } from 'react';

import { useNavigate, Link } from "react-router";
import LocalStorage from '../helper/LocalStorage';
import { AppContext } from '../helper/Context';
import i18n from '../helper/I18n';
import Icon from './Icon';


function NavBar(props: { navs: { path: string; element: JSX.Element; name: string; useInNavBar?: boolean }[] }) {
    const { setContextKey } = useContext(AppContext);
    const initialTheme = LocalStorage.LoadItem('theme') || (document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
    const [theme, setTheme] = useState(initialTheme);
    var navigate = useNavigate();

    useEffect(() => {
        document.body.setAttribute('data-theme', theme);
        LocalStorage.safeItem('theme', theme);
        setContextKey("theme", theme);
    }, [theme]);

    function toggleTheme(curTheme: string) {
        if (curTheme === 'light') {
            setTheme('dark');
            LocalStorage.safeItem('theme', 'dark');
            setContextKey("theme", "dark");
        } else {
            setTheme('light');
            LocalStorage.safeItem('theme', 'light');
            setContextKey("theme", "light");
        }
    }

    return (
        <div style={{ background: "var(--navbar-gradient)", width: "100%", position: "sticky", top: 0, display: "grid", gridAutoFlow: "column", height: "3em", alignItems: "center", gridTemplateColumns: "auto auto 1fr auto", zIndex: 100, gap: "1em", color: "var(--light-fixed)" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
                {/* <img src={"logoUS"} style={{ height: "2em", marginLeft: "1em", cursor: "pointer", userSelect: "none" }} onClick={() => navigate("/")} /> */}
                {/* <img src={logoSI} style={{ height: "3em", cursor: "pointer", userSelect: "none" }} onClick={() => navigate("/")} /> */}
            </div>
            <span style={{ fontWeight: "bolder", marginRight: "1em", cursor: "pointer" }} onClick={() => navigate("/")}>{i18n('Nav.Headline')}</span>
            <div style={{ fontWeight: "bold", marginLeft: "2em" }}>
                {props.navs.map((nav, i) => {
                    return (
                        nav.useInNavBar ? <Link key={nav.name + i} to={nav.path} style={{ color: "var(--light-fixed)", textDecoration: "none", marginRight: "1em" }}>{nav.name}</Link> : null
                    );
                })}
            </div>
            <Icon style={{ marginRight: "1em" }} name={theme === "light" ? "bedtime" : "sunny"} onClick={() => toggleTheme(theme)} />
        </div>
    );
}

export default NavBar;