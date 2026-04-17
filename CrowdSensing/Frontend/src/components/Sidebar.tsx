import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router";
import Icon from "./Icon";
import LocalStorage from "../helper/LocalStorage";
import { AppContext } from "../helper/Context";



const ulStyle: React.CSSProperties = {
    listStyle: "none",
    padding: 0,
    margin: 0,
};
const linkStyle: React.CSSProperties = {
    fontSize: "1.2rem",
    color: "var(--forground)",
    borderRadius: "0.5rem",
    textDecoration: "none",
    padding: "0.5rem",
    transition: "background 0.3s, color 0.3s",
};

const linkHoverStyle: React.CSSProperties = {
    background: "var(--sidebar-hover)",
    transition: "background 0.3s, color 0.3s",
};

const bottomButtonContainerStyle: React.CSSProperties = {
    padding: "1rem",
};


export const Sidebar: React.FC = () => {
    const { setContextKey } = useContext(AppContext);
    const initialTheme = LocalStorage.LoadItem('theme') || (document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
    const [theme, setTheme] = useState(initialTheme);
    const [hovered, setHovered] = React.useState<string | null>(null);

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

    useEffect(() => {
        document.body.setAttribute('data-theme', theme);
        LocalStorage.safeItem('theme', theme);
        setContextKey("theme", theme);
    }, [theme]);


    return (
        <nav style={{ display: "grid", gridTemplateRows: "1fr auto" }}>
            <ul style={ulStyle}>
                <li style={{ textAlign: "center", marginTop: "1.5rem" }}>
                    <Link to="/"
                        style={{ ...linkStyle, ...(hovered === "home" ? linkHoverStyle : {}), }}
                        onMouseEnter={() => setHovered("home")}
                        onMouseLeave={() => setHovered(null)}>
                        Home
                    </Link>
                </li>
                <li style={{ textAlign: "center", marginTop: "1.5rem" }}>
                    <Link to="/Test"
                        style={{ ...linkStyle, ...(hovered === "test" ? linkHoverStyle : {}), }}
                        onMouseEnter={() => setHovered("test")}
                        onMouseLeave={() => setHovered(null)}>
                        Test
                    </Link>
                </li>
            </ul>
            <div style={bottomButtonContainerStyle}>
                <Icon style={{ marginRight: "1em" }} name={theme === "light" ? "bedtime" : "sunny"} onClick={() => toggleTheme(theme)} />
                <Icon style={{ marginRight: "1em" }} name={"settings"} onClick={() => console.log("TODO Settings")} />
            </div>
        </nav>
    );

};

export default Sidebar;