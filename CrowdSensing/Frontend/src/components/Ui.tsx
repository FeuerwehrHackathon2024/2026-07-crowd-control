import type { ReactNode } from "react";
import { useState, useEffect, useRef } from "react";
import Icon from "./Icon";

export function Button(props: { text?: string; iconName?: string; onClick?: () => void; children?: ReactNode; bntType?: number, style?: React.CSSProperties; spin?: boolean }) {

    var bntType = props.bntType || 4;
    return (
        <button
            style={{
                background: bntType == 1 ? "var(--button-primary-background)" : "unset",
                backgroundColor: bntType == 2 ? "var(--button-secondary-background)" : bntType == 3 ? "var(--button-tertiary-background)" : "unset",
                borderRadius: "0.5em", fontSize: "1em", cursor: "pointer", border: bntType != 4 ? "none" : "2px solid var(--foreground)", padding: "0.5em", color: "var(--foreground)",
                display: "flex", alignItems: "center", gap: props.iconName ? "0.5em" : 0,
                ...props.style
            }}
            onClick={props.onClick}>
            {props.iconName ? <Icon style={{ cursor: "pointer" }} name={props.iconName} spin={props.spin} /> : null}
            {props.text ? props.text : null}
            {props.children ? props.children : null}
        </button>
    );
}

export function Input(props:
    {
        value?: string | number;
        fontSize?: string;
        bgType?: number;
        style?: React.CSSProperties;
        rows?: number;
        width?: string;
        height?: string;
        type?: string;
        defaultValue?: string | number;
        placeholder?: string;
        options?: { name: string; value: string }[];
        showAllOptions?: boolean;
        preText?: string;
        preIcon?: string;
        buttonText?: string;
        buttonIcon?: string;
        buttonType?: number;
        showStepper?: boolean;
        keyFilter?: string[];
        spin?: boolean;
        onChange?: (e: any) => void,
        onEnter?: () => void;
        onClick?: () => void
    }) {
    const [hasFocus, setHasFocus] = useState(false);

    switch (props.type) {
        case "textarea": {
            const [localValue, setLocalValue] = useState(() => {
                if (props.value !== undefined) {
                    return String(props.value);
                }
                return String(props.defaultValue ?? "");
            });

            useEffect(() => {
                if (props.value !== undefined) {
                    setLocalValue(String(props.value));
                    return;
                }
                setLocalValue(String(props.defaultValue ?? ""));
            }, [props.value, props.defaultValue]);

            const handleTextareaChange = (e: any) => {
                const value = e.target.value;
                setLocalValue(value);
                props.onChange?.({ target: { value: value } });
            };

            return (
                <div style={{
                    width: props.width ? props.width : "unset", display: "grid", gridTemplateColumns: "auto 1fr auto",
                    fontSize: "1em",
                    border: hasFocus ? "2px solid var(--input-border-focused)" : "2px solid var(--input-border)", borderRadius: "1em",
                    background: props.bgType == 1 ? "var(--input-primary-background)" : "unset",
                    backgroundColor: props.bgType == 2 ? "var(--input-secondary-background)" : props.bgType == 3 ? "var(--input-tertiary-background)" : "unset",
                }}>
                    {props.preIcon || props.preText ? <div style={{
                        cursor: "default",
                        borderTopLeftRadius: "1em", borderBottomLeftRadius: "1em",
                        borderRight: props.preIcon || props.preText ? hasFocus ? "2px solid var(--input-border-focused)" : "2px solid var(--input-border)" : "none",
                        display: "flex", alignItems: "center", paddingLeft: "0.5em", paddingRight: "0.5em", fontSize: "1em"
                    }}>
                        {props.preText ? <span>{props.preText}</span> : null}
                        {props.preIcon ? <Icon style={{ marginLeft: props.preText || props.preIcon ? "1em" : "none" }} name={props.preIcon || ""} /> : null}
                    </div> : <div></div>}
                    <textarea
                        rows={props.rows}
                        autoComplete="off"
                        spellCheck="false"
                        style={{
                            resize: "none",
                            fontSize: props.fontSize ? props.fontSize : "1em",
                            backgroundColor: props.preText || props.preIcon || props.buttonIcon || props.buttonText ? "var(--bg-transparent)" : "unset",
                            color: "var(--foreground)",
                            padding: "0.5em",
                            height: props.height ? props.height : "unset",
                            border: "0px solid transparent",
                            borderTopLeftRadius: props.preIcon || props.preText ? "0em" : "1em",
                            borderBottomLeftRadius: props.preIcon || props.preText ? "0em" : "1em",
                            borderTopRightRadius: props.buttonText || props.buttonIcon ? "0em" : "1em",
                            borderBottomRightRadius: props.buttonText || props.buttonIcon ? "0em" : "1em",
                            outline: "none",
                            ...props.style
                        }}
                        placeholder={props.placeholder}
                        onFocus={() => setHasFocus(true)}
                        onBlur={() => setHasFocus(false)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && props.onEnter) { e.preventDefault(); props.onEnter() } }}
                        value={localValue}
                        onChange={handleTextareaChange}
                        readOnly={!props.onChange}>
                    </textarea>
                    {props.buttonText || props.buttonIcon ? <Button style={{ borderRadius: "1em", borderTopLeftRadius: "0", borderBottomLeftRadius: "0", borderLeft: props.buttonText || props.buttonIcon ? hasFocus ? "2px solid var(--input-border-focused)" : "2px solid var(--input-border)" : "none", background: "transparent" }} text={props.buttonText} iconName={props.buttonIcon} bntType={5} onClick={props.onClick} spin={props.spin} /> : null}
                </div >
            );
        }
        case "text": {
            const [localValue, setLocalValue] = useState(() => {
                if (props.value !== undefined) {
                    return String(props.value);
                }
                return String(props.defaultValue ?? "");
            });

            useEffect(() => {
                if (props.value !== undefined) {
                    setLocalValue(String(props.value));
                    return;
                }
                setLocalValue(String(props.defaultValue ?? ""));
            }, [props.value, props.defaultValue]);

            const handleTextChange = (e: any) => {
                const value = e.target.value;
                setLocalValue(value);
                props.onChange?.({ target: { value: value } });
            };

            return (
                <div style={{
                    width: props.width ? props.width : "unset", display: "grid", gridTemplateColumns: "auto 1fr auto",
                    fontSize: "1em",
                    border: hasFocus ? "2px solid var(--input-border-focused)" : "2px solid var(--input-border)", borderRadius: "1em",
                    background: props.bgType == 1 ? "var(--input-primary-background)" : "unset",
                    backgroundColor: props.bgType == 2 ? "var(--input-secondary-background)" : props.bgType == 3 ? "var(--input-tertiary-background)" : "unset",
                }}>
                    {props.preIcon || props.preText ? <div style={{
                        cursor: "default",
                        borderTopLeftRadius: "1em", borderBottomLeftRadius: "1em",
                        borderRight: props.preIcon || props.preText ? hasFocus ? "2px solid var(--input-border-focused)" : "2px solid var(--input-border)" : "none",
                        display: "flex", alignItems: "center", paddingLeft: "0.5em", paddingRight: "0.5em", fontSize: "1em"
                    }}>
                        {props.preText ? <span>{props.preText}</span> : null}
                        {props.preIcon ? <Icon style={{ marginLeft: props.preText || props.preIcon ? "1em" : "none" }} name={props.preIcon || ""} /> : null}
                    </div> : <div></div>}
                    <input
                        type={props.type}
                        style={{
                            fontSize: props.fontSize ? props.fontSize : "1em",
                            backgroundColor: props.preText || props.preIcon || props.buttonIcon || props.buttonText ? "var(--bg-transparent)" : "unset",
                            color: "var(--foreground)",
                            padding: "0.5em",
                            height: props.height ? props.height : "unset",
                            border: "0px solid transparent",
                            borderTopLeftRadius: props.preIcon || props.preText ? "0em" : "1em",
                            borderBottomLeftRadius: props.preIcon || props.preText ? "0em" : "1em",
                            borderTopRightRadius: props.buttonText || props.buttonIcon ? "0em" : "1em",
                            borderBottomRightRadius: props.buttonText || props.buttonIcon ? "0em" : "1em",
                            outline: "none",
                            ...props.style
                        }}
                        placeholder={props.placeholder}
                        onFocus={() => setHasFocus(true)}
                        onBlur={() => setHasFocus(false)}
                        onKeyDown={(e) => { e.key === 'Enter' && props.onEnter ? props.onEnter() : null }}
                        value={localValue}
                        onChange={handleTextChange}
                        readOnly={!props.onChange} />
                    {props.buttonText || props.buttonIcon ? <Button style={{ borderRadius: "1em", borderTopLeftRadius: "0", borderBottomLeftRadius: "0", borderLeft: props.buttonText || props.buttonIcon ? hasFocus ? "2px solid var(--input-border-focused)" : "2px solid var(--input-border)" : "none", background: "transparent" }} text={props.buttonText} iconName={props.buttonIcon} bntType={5} onClick={props.onClick} spin={props.spin} /> : null}
                </div>
            );
        }
        case "dropdown": {
            const [isOpen, setIsOpen] = useState(false);

            const resolveInitial = () => {
                if (props.value !== undefined) return String(props.value);
                const dv = props.defaultValue !== undefined ? String(props.defaultValue).toLocaleLowerCase() : "";
                const match = props.options?.find(
                    opt => opt.name?.toLocaleLowerCase() === dv || String(opt.value ?? "").toLocaleLowerCase() === dv
                );
                return match?.value ?? "";
            };

            const [selectedValue, setSelectedValue] = useState(resolveInitial());
            const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
            const dropdownRef = useRef<HTMLDivElement>(null);

            useEffect(() => {
                if (props.value !== undefined) {
                    setSelectedValue(String(props.value));
                    return;
                }
                const dv = props.defaultValue !== undefined ? String(props.defaultValue).toLocaleLowerCase() : "";
                const match = props.options?.find(
                    opt => opt.name?.toLocaleLowerCase() === dv || String(opt.value ?? "").toLocaleLowerCase() === dv
                );
                setSelectedValue(match?.value ?? "");
            }, [props.value, props.defaultValue, props.options]);

            useEffect(() => {
                const handleClickOutside = (event: MouseEvent) => {
                    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                        setIsOpen(false);
                    }
                };

                if (isOpen) {
                    document.addEventListener('mousedown', handleClickOutside);
                    return () => {
                        document.removeEventListener('mousedown', handleClickOutside);
                    };
                }
            }, [isOpen]);

            const availableOptions = props.showAllOptions ? props.options : selectedValue
                ? props.options?.filter(opt => opt.value !== selectedValue)
                : props.options;

            return (
                <div
                    ref={dropdownRef}
                    style={{
                        width: props.width ? props.width : "unset", display: "grid", gridTemplateColumns: "auto 1fr auto",
                        fontSize: "1em",
                        border: hasFocus ? "2px solid var(--input-border-focused)" : "2px solid var(--input-border)", borderRadius: "1em",
                        background: props.bgType == 1 ? "var(--input-primary-background)" : "unset",
                        backgroundColor: props.bgType == 2 ? "var(--input-secondary-background)" : props.bgType == 3 ? "var(--input-tertiary-background)" : "unset",
                        position: "relative",
                    }}>
                    {props.preIcon || props.preText ? <div style={{
                        cursor: "default",
                        borderTopLeftRadius: "1em", borderBottomLeftRadius: "1em",
                        borderRight: props.preIcon || props.preText ? hasFocus ? "2px solid var(--input-border-focused)" : "2px solid var(--input-border)" : "none",
                        display: "flex", alignItems: "center", paddingLeft: "0.5em", paddingRight: "0.5em", fontSize: "1em"
                    }}>
                        {props.preText ? <span>{props.preText}</span> : null}
                        {props.preIcon ? <Icon style={{ marginLeft: props.preText || props.preIcon ? "1em" : "none" }} name={props.preIcon || ""} /> : null}
                    </div> : <div></div>}

                    <div style={{ position: "relative" }}>
                        <div
                            onClick={() => setIsOpen(!isOpen)}
                            onFocus={() => setHasFocus(true)}
                            onBlur={() => setHasFocus(false)}
                            style={{
                                padding: "0.5em",
                                color: "var(--foreground)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                backgroundColor: props.preText || props.preIcon || props.buttonIcon || props.buttonText ? "var(--bg-transparent)" : "unset",
                                minHeight: "1.5em",
                            }}>
                            {props.options?.find(opt => opt.value === selectedValue)?.name || ""}
                            <Icon style={{
                                marginLeft: "auto",
                                transition: "transform 0.3s ease",
                                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)"
                            }}
                                name="arrow_drop_down" />
                        </div>

                        {isOpen && (
                            <div style={{
                                position: "absolute",
                                top: "100%",
                                left: props.preIcon || props.preText ? "0" : "1em",
                                right: props.buttonIcon || props.buttonText ? "0" : "1em",
                                background: props.bgType == 1 ? "var(--input-primary-background)" : "unset",
                                backgroundColor: props.bgType == 2 ? "var(--input-secondary-background)" : props.bgType == 3 ? "var(--input-tertiary-background)" : "unset",
                                border: "2px solid var(--input-border)",
                                borderTopLeftRadius: "0",
                                borderTopRightRadius: "0",
                                borderBottomLeftRadius: "1em",
                                borderBottomRightRadius: "1em",
                                zIndex: 1000,
                                maxHeight: "200px",
                                overflowY: "auto",
                                minWidth: "150px",
                            }}>
                                {availableOptions?.map((option, index) => (
                                    <div
                                        key={index}
                                        onMouseEnter={() => setHoveredIndex(index)}
                                        onMouseLeave={() => setHoveredIndex(null)}
                                        onClick={() => {
                                            setSelectedValue(option.value);
                                            setIsOpen(false);
                                            props.onChange?.({ target: { value: option.value } });
                                        }}
                                        style={{
                                            padding: "0.5em",
                                            color: "var(--foreground)",
                                            cursor: "pointer",
                                            backgroundColor: hoveredIndex === index ? "var(--bg-hover)" : "transparent",
                                            borderBottomLeftRadius: index === availableOptions!.length - 1 ? "1em" : "0",
                                            borderBottomRightRadius: index === availableOptions!.length - 1 ? "1em" : "0",
                                            whiteSpace: "nowrap",
                                        }}>
                                        {option.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {props.buttonText || props.buttonIcon ? <Button style={{ borderRadius: "1em", borderTopLeftRadius: "0", borderBottomLeftRadius: "0", borderLeft: props.buttonText || props.buttonIcon ? hasFocus ? "2px solid var(--input-border-focused)" : "2px solid var(--input-border)" : "none", background: "transparent" }} text={props.buttonText} iconName={props.buttonIcon} bntType={5} onClick={props.onClick} spin={props.spin} /> : null}
                </div>
            );
        }
        case "int": {
            const [localValue, setLocalValue] = useState(() => {
                if (props.value !== undefined) {
                    return String(props.value);
                }
                return String(props.defaultValue ?? "");
            });

            useEffect(() => {
                if (props.value !== undefined) {
                    setLocalValue(String(props.value));
                    return;
                }
                setLocalValue(String(props.defaultValue ?? ""));
            }, [props.value, props.defaultValue]);

            const allowedChars = new Set(props.keyFilter ?? ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);
            const controlKeys = new Set([
                "Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
                "Tab", "Enter", "Home", "End"
            ]);

            const handleChange = (newVal: string) => {
                setLocalValue(String(newVal));
                const numValue = newVal === "" ? "" : parseInt(newVal, 10);
                props.onChange?.({ target: { value: numValue } });
            };

            return (
                <div style={{
                    width: props.width ? props.width : "unset", display: "grid", gridTemplateColumns: "auto 1fr auto auto auto",
                    fontSize: "1em",
                    border: hasFocus ? "2px solid var(--input-border-focused)" : "2px solid var(--input-border)", borderRadius: "1em",
                    background: props.bgType == 1 ? "var(--input-primary-background)" : "unset",
                    backgroundColor: props.bgType == 2 ? "var(--input-secondary-background)" : props.bgType == 3 ? "var(--input-tertiary-background)" : "unset",
                }}>
                    {props.preIcon || props.preText ? <div style={{
                        cursor: "default",
                        borderTopLeftRadius: "1em", borderBottomLeftRadius: "1em",
                        borderRight: props.preIcon || props.preText ? hasFocus ? "2px solid var(--input-border-focused)" : "2px solid var(--input-border)" : "none",
                        display: "flex", alignItems: "center", paddingLeft: "0.5em", paddingRight: "0.5em", fontSize: "1em"
                    }}>
                        {props.preText ? <span>{props.preText}</span> : null}
                        {props.preIcon ? <Icon style={{ marginLeft: props.preText || props.preIcon ? "1em" : "none" }} name={props.preIcon || ""} /> : null}
                    </div> : <div></div>}
                    <input
                        type="number"
                        style={{
                            fontSize: props.fontSize ? props.fontSize : "1em",
                            backgroundColor: props.preText || props.preIcon || props.buttonIcon || props.buttonText ? "var(--bg-transparent)" : "unset",
                            color: "var(--foreground)",
                            padding: "0.5em",
                            height: props.height ? props.height : "unset",
                            border: "0px solid transparent",
                            borderTopLeftRadius: props.preIcon || props.preText ? "0em" : "1em",
                            borderBottomLeftRadius: props.preIcon || props.preText ? "0em" : "1em",
                            borderTopRightRadius: props.buttonText || props.buttonIcon ? "0em" : "1em",
                            borderBottomRightRadius: props.buttonText || props.buttonIcon ? "0em" : "1em",
                            outline: "none",
                            ...props.style
                        }}
                        value={String(localValue)}
                        placeholder={props.placeholder}
                        onFocus={() => setHasFocus(true)}
                        onBlur={() => setHasFocus(false)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && props.onEnter) props.onEnter();

                            if (controlKeys.has(e.key)) return;

                            if ((e.ctrlKey || e.metaKey) && ["a", "c", "v", "x"].includes(e.key.toLowerCase())) return;

                            if (e.key.length === 1 && !allowedChars.has(e.key)) {
                                e.preventDefault();
                            }
                        }}
                        onChange={(e) => {
                            const filtered = Array.from(e.target.value)
                                .filter(ch => allowedChars.has(ch))
                                .join("");
                            handleChange(filtered);
                        }} />
                    {props.showStepper !== false ? <Button style={{ borderRadius: "1em", borderTopLeftRadius: "0", borderBottomLeftRadius: "0", borderLeft: props.buttonText || props.buttonIcon ? hasFocus ? "2px solid var(--input-border-focused)" : "2px solid var(--input-border)" : "none", background: "transparent" }} iconName="remove" bntType={5} onClick={() => handleChange(String(Number(localValue || "0") - 1))} /> : null}
                    {props.showStepper !== false ? <Button style={{ borderRadius: "1em", borderTopLeftRadius: "0", borderBottomLeftRadius: "0", borderLeft: props.buttonText || props.buttonIcon ? hasFocus ? "2px solid var(--input-border-focused)" : "2px solid var(--input-border)" : "none", background: "transparent" }} iconName="add" bntType={5} onClick={() => handleChange(String(Number(localValue || "0") + 1))} /> : null}
                    {props.buttonText || props.buttonIcon ? <Button style={{ borderRadius: "1em", borderTopLeftRadius: "0", borderBottomLeftRadius: "0", borderLeft: props.buttonText || props.buttonIcon ? hasFocus ? "2px solid var(--input-border-focused)" : "2px solid var(--input-border)" : "none", background: "transparent" }} text={props.buttonText} iconName={props.buttonIcon} bntType={5} onClick={props.onClick} spin={props.spin} /> : null}
                </div>
            );
        }
        case "float": {
            const [localValue, setLocalValue] = useState(() => {
                const initial = props.value !== undefined ? String(props.value) : String(props.defaultValue ?? "");
                if (initial === "") return "";
                if (initial.includes('.') || initial.includes(',')) return initial;
                return initial + ".0";
            });

            useEffect(() => {
                if (hasFocus) return; // don't override while user is typing
                const next = props.value !== undefined ? String(props.value) : String(props.defaultValue ?? "");
                if (next === "") { setLocalValue(""); return; }
                if (next.includes('.') || next.includes(',')) { setLocalValue(next); return; }
                const preferComma = localValue.includes(',');
                setLocalValue(preferComma ? next + ",0" : next + ".0");
            }, [props.value, props.defaultValue, hasFocus]);

            const handleFloatChange = (e: any) => {
                const raw = e.target.value as string;
                setLocalValue(raw);
                const normalized = raw.replace(',', '.');
                const numValue = raw === "" || isNaN(parseFloat(normalized)) ? "" : parseFloat(normalized);
                props.onChange?.({ target: { value: numValue } });
            };

            const handleFloatBlur = () => {
                setHasFocus(false);
                if (localValue === "") return;
                const normalized = localValue.replace(',', '.');
                if (isNaN(parseFloat(normalized))) return;
                const decimals = Math.max(1, (normalized.split('.')[1] || "").length);
                const formattedDot = parseFloat(normalized).toFixed(decimals);
                const formatted = localValue.includes(',') ? formattedDot.replace('.', ',') : formattedDot;
                setLocalValue(formatted);
                props.onChange?.({ target: { value: parseFloat(formattedDot) } });
            };

            return (
                <div style={{
                    width: props.width ? props.width : "unset", display: "grid", gridTemplateColumns: "auto 1fr auto auto auto",
                    fontSize: "1em",
                    border: hasFocus ? "2px solid var(--input-border-focused)" : "2px solid var(--input-border)", borderRadius: "1em",
                    background: props.bgType == 1 ? "var(--input-primary-background)" : "unset",
                    backgroundColor: props.bgType == 2 ? "var(--input-secondary-background)" : props.bgType == 3 ? "var(--input-tertiary-background)" : "unset",
                }}>
                    {props.preIcon || props.preText ? <div style={{
                        cursor: "default",
                        borderTopLeftRadius: "1em", borderBottomLeftRadius: "1em",
                        borderRight: props.preIcon || props.preText ? hasFocus ? "2px solid var(--input-border-focused)" : "2px solid var(--input-border)" : "none",
                        display: "flex", alignItems: "center", paddingLeft: "0.5em", paddingRight: "0.5em", fontSize: "1em"
                    }}>
                        {props.preText ? <span>{props.preText}</span> : null}
                        {props.preIcon ? <Icon style={{ marginLeft: props.preText || props.preIcon ? "1em" : "none" }} name={props.preIcon || ""} /> : null}
                    </div> : <div></div>}
                    <input
                        type="number"
                        style={{
                            fontSize: props.fontSize ? props.fontSize : "1em",
                            backgroundColor: props.preText || props.preIcon || props.buttonIcon || props.buttonText ? "var(--bg-transparent)" : "unset",
                            color: "var(--foreground)",
                            padding: "0.5em",
                            height: props.height ? props.height : "unset",
                            border: "0px solid transparent",
                            borderTopLeftRadius: props.preIcon || props.preText ? "0em" : "1em",
                            borderBottomLeftRadius: props.preIcon || props.preText ? "0em" : "1em",
                            borderTopRightRadius: props.buttonText || props.buttonIcon ? "0em" : "1em",
                            borderBottomRightRadius: props.buttonText || props.buttonIcon ? "0em" : "1em",
                            outline: "none",
                            ...props.style
                        }}
                        placeholder={props.placeholder}
                        onFocus={() => setHasFocus(true)}
                        onBlur={handleFloatBlur}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && props.onEnter) props.onEnter();
                        }}
                        step="any"
                        value={localValue}
                        onChange={handleFloatChange}
                        readOnly={!props.onChange} />

                    {props.buttonText || props.buttonIcon ? <Button style={{ borderRadius: "1em", borderTopLeftRadius: "0", borderBottomLeftRadius: "0", borderLeft: props.buttonText || props.buttonIcon ? hasFocus ? "2px solid var(--input-border-focused)" : "2px solid var(--input-border)" : "none", background: "transparent" }} text={props.buttonText} iconName={props.buttonIcon} bntType={5} onClick={props.onClick} spin={props.spin} /> : null}
                </div>
            );
        }
        default: return null;
    }
}