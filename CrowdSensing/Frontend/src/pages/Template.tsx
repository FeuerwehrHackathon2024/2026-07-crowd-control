import { useState } from 'react';
import { useNavigate } from "react-router";
import i18n from '../helper/I18n';
import { Button } from '../components/Ui';

function Template() {
    const [count, setCount] = useState(0);
    var navigate = useNavigate();
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1em", justifyContent: "center", alignItems: "center", marginTop: "1em", marginBottom: "2em" }}>
            <h2>{i18n('Pages.Template.PageName')}</h2>
            <Button bntType={1} onClick={() => setCount(c => c + 1)}>{count ? count : "0"}</Button>
            <Button bntType={2} onClick={() => navigate("/")}>{i18n('Pages.Home.PageName')}</Button>
            <span>{i18n('General.Hello')}</span>
        </div>
    );
}

export default Template;