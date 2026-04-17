import i18n from '../helper/I18n';


function Home() {

    return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0em", justifyContent: "center", alignItems: "center", marginTop: "1em", marginBottom: "2em" }}>
      <h2>{i18n('Pages.Home.PageName')}</h2>
      <p>{i18n('Pages.Home.Header')}</p>
    </div>
    );
}

export default Home;