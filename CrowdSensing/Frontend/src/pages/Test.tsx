import { useState, useContext, useEffect } from 'react';
import { useNavigate } from "react-router";
import i18n from '../helper/I18n';
import { Button, Input } from '../components/Ui';
import Icon from '../components/Icon';
import LocalStorage from '../helper/LocalStorage';
import { AppContext } from '../helper/Context';
import Data from '../helper/Data';
import Event from '../helper/MyEvent';

function Test() {
    const { ContextValues, setContextKey, removeContextKey } = useContext(AppContext);
    const [input, setInput] = useState('');
    const [count, setCount] = useState(0);
    const [joke, setJoke] = useState(null as any);
    const [evData, setEvData] = useState(null as any);
    var navigate = useNavigate();

    useEffect(() => {
        Event.subscribe('testEvent', (e: any) => {
            setEvData(e.detail.message);
        });

        return () => {
            Event.unsubscribe('testEvent');
        };
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1em", justifyContent: "center", alignItems: "center", marginTop: "1em", marginBottom: "2em" }}>
            <h2>Test</h2>
            <Button onClick={() => setCount(c => c + 1)}>Count: {count}</Button>
            <Button onClick={() => navigate("/")}>Test</Button>
            <span>Translation: {i18n('General.Test')}</span>
            <Icon name="coffee" />
            <Button bntType={1}>Primary</Button>
            <Button bntType={1} iconName="coffee"></Button>
            <Button bntType={2} iconName="coffee">Secondary</Button>
            <Button bntType={3}>Tertiary</Button>
            <Button>Quaternary - none</Button>
            <div style={{ height: "1em" }}></div>
            <span>Event Tests</span>

            <Button bntType={3} onClick={() => {
                Event.dispatch('testEvent', { message: 'Hello from Test page!' });
            }}>dispatch Test Event</Button>
            <span>Event Data: {evData}</span>
            <Button bntType={3} onClick={async () => {
                await Data.testSpinner();
            }}>Test Loading Spinner</Button>

            <div style={{ height: "1em" }}></div>
            <span>Data Tests</span>
            <Button bntType={3} onClick={async () => {
                const joke = await Data.getJoke();
                setJoke(joke);
            }}>Get Joke</Button>
            <span>{joke?.value}</span>

            <div style={{ height: "1em" }}></div>
            <span>Local Storage Tests</span>
            <Button bntType={3} onClick={() => console.log(LocalStorage.LoadItem("testKey"))}>Load Local Storage</Button>
            <Button bntType={3} onClick={() => LocalStorage.safeItem("testKey", "testValue")}>Safe Local Storage</Button>
            <Button bntType={3} onClick={() => LocalStorage.deleateItem("testKey")}>Deleate Local Storage</Button>
            <Button bntType={3} onClick={() => LocalStorage.deleateItem("theme")}>Deleate Local Storage Theme</Button>
            <div style={{ height: "1em" }}></div>
            <div>
                <p>Value for Context "Test": {String(ContextValues.Test ?? '—')}</p>
                <input value={input} onChange={e => setInput(e.target.value)} />
                <button onClick={() => setContextKey('Test', input)}>Set Test</button>
                <button onClick={() => removeContextKey('Test')}>Remove Test</button>
            </div>
            <span>{JSON.stringify(ContextValues)}</span>
            <div style={{ height: "1em" }}></div>

            <span>TestInput</span>
            <Input
                width='30em'
                bgType={1}
                type="text"
                defaultValue="Start value"
                placeholder="Type sthng"
                preText="PreText"
                preIcon="search"
                buttonText="Send"
                buttonIcon="add"
                onChange={() => { console.log("Input changed"); }}
                onEnter={() => { console.log("Enter pressed"); }}
                onClick={() => { console.log("Button clicked"); }}
            />
            <Input
                width='30em'
                bgType={2}
                type="text"
                placeholder="Type sthng"
                buttonText="Send"
                buttonIcon="add"
                onChange={() => { console.log("Input changed"); }}
                onEnter={() => { console.log("Enter pressed"); }}
                onClick={() => { console.log("Button clicked"); }}
            />
            <Input
                width='30em'
                bgType={3}
                type="text"
                defaultValue="Start value"
                placeholder="Type sthng"
                preText="PreText"
                preIcon="search"
                onChange={() => { console.log("Input changed"); }}
                onEnter={() => { console.log("Enter pressed"); }}
                onClick={() => { console.log("Button clicked"); }}
            />
            <Input bgType={1} width='30em' type="text" placeholder="Type here" onChange={e => console.log(e.target.value)} />
            <Input width='30em' type="text" placeholder="Type here" onChange={e => console.log(e.target.value)} />


        </div>
    );
}

export default Test;