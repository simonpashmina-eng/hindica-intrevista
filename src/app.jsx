import { useState } from "react";

const C = {
  bg:"#FAF7F2", dark:"#1C3A2E", orange:"#E8621F", purple:"#8B3A7E",
  gold:"#C9963E", text:"#1A1A1A", muted:"#7A7065", border:"#DDD5C8",
  green:"#2D7A45", red:"#C0392B", white:"#FFFFFF", lightGreen:"#E8F5EE",
};
const sInput = { width:"100%", padding:"14px 16px", borderRadius:12, border:`2px solid ${C.border}`, fontSize:15, background:C.white, color:C.text, boxSizing:"border-box", outline:"none", fontFamily:"inherit", resize:"vertical" };
const sBtn = (color=C.orange, full=false) => ({ background:color, color:C.white, border:"none", borderRadius:14, padding:"16px 24px", fontSize:16, fontWeight:700, cursor:"pointer", width:full?"100%":"auto", fontFamily:"inherit" });

const PREGUNTAS = [
  { id:"nombre", label:"¿Cuál es tu nombre completo?", tipo:"texto", criterio:null, placeholder:"Tu nombre completo..." },
  { id:"edad", label:"¿Cuántos años tienes?", tipo:"texto", criterio:null, placeholder:"Tu edad..." },
  { id:"disponibilidad", label:"¿Cuál es tu disponibilidad horaria? ¿Hay días o horarios que no puedas?", tipo:"largo", criterio:null, placeholder:"Ej: Disponible de lunes a sábado, no puedo los miércoles por la mañana..." },
  { id:"experiencia", label:"¿Has trabajado antes en ventas o atención al cliente? Cuéntanos dónde y cuánto tiempo.", tipo:"largo", criterio:"responsabilidad", placeholder:"Si no tienes experiencia previa, está bien — cuéntanos tu experiencia general..." },
  { id:"motivacion", label:"¿Por qué quieres trabajar con Hindica? ¿Qué sabes de nuestra marca?", tipo:"largo", criterio:"motivacion", placeholder:"Cuéntanos qué te llamó la atención de Hindica..." },
  { id:"error", label:"¿Alguna vez cometiste un error en el trabajo o en algo importante? ¿Qué pasó y qué hiciste?", tipo:"largo", criterio:"honestidad", placeholder:"Sé honesta — todos cometemos errores. Lo que nos importa es cómo los manejas..." },
  { id:"dinero", label:"Si al final del día notas que hay una diferencia en la caja (falta o sobra dinero), ¿qué harías?", tipo:"largo", criterio:"honestidad", placeholder:"Descríbenos paso a paso qué harías..." },
  { id:"tardanza", label:"¿Alguna vez llegaste tarde o faltaste a un trabajo o compromiso importante sin avisar? ¿Qué pasó?", tipo:"largo", criterio:"confiabilidad", placeholder:"Sé honesta. Si nunca te ha pasado, cuéntanos cómo organizas tu tiempo..." },
  { id:"dificil", label:"Describe un día difícil que hayas tenido (en el trabajo, en la vida). ¿Cómo lo manejaste?", tipo:"largo", criterio:"esfuerzo", placeholder:"Puede ser cualquier situación exigente — laboral, personal, académica..." },
  { id:"reglas", label:"En Hindica tenemos una forma muy específica de trabajar: checklist diario, fotos, registrar cada venta, seguir un método de atención. ¿Cómo te sientes con ese nivel de estructura?", tipo:"largo", criterio:"esfuerzo", placeholder:"Sé honesta sobre cómo trabajas mejor..." },
  { id:"cliente_dificil", label:"¿Qué harías si una clienta está de mal humor o te habla de mala manera?", tipo:"largo", criterio:"responsabilidad", placeholder:"Cuéntanos cómo manejarías esa situación..." },
  { id:"algo_mas", label:"¿Hay algo que quieras contarnos sobre ti que no te hayamos preguntado?", tipo:"largo", criterio:null, placeholder:"Cualquier cosa que creas relevante (opcional)..." },
];

function ProgressBar({ current, total }) {
  return (
    <div style={{ padding:"16px 24px 0" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
        <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)", fontWeight:700 }}>Pregunta {current} de {total}</span>
        <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)" }}>{Math.round((current/total)*100)}% completado</span>
      </div>
      <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:6, height:6 }}>
        <div style={{ background:C.orange, height:6, borderRadius:6, width:`${(current/total)*100}%`, transition:"width 0.3s" }}/>
      </div>
    </div>
  );
}

export default function EntrevistaHindica() {
  const [step, setStep] = useState("bienvenida"); // bienvenida | preguntas | evaluando | gracias | resultados
  const [current, setCurrent] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [valor, setValor] = useState("");
  const [evaluacion, setEvaluacion] = useState(null);
  const [adminCode, setAdminCode] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminInput, setAdminInput] = useState("");

  const ADMIN_CODE = "hindica2024";

  const pregunta = PREGUNTAS[current];
  const nombre = respuestas["nombre"] || "candidata";

  const avanzar = () => {
    const nuevas = { ...respuestas, [pregunta.id]: valor };
    setRespuestas(nuevas);
    setValor("");
    if (current < PREGUNTAS.length - 1) {
      setCurrent(c => c + 1);
    } else {
      evaluar(nuevas);
    }
  };

  const evaluar = async (resp) => {
    setStep("evaluando");
    try {
      const resumen = PREGUNTAS.map(p => `${p.label}\nRespuesta: ${resp[p.id] || "(sin respuesta)"}`).join("\n\n");
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Eres un evaluador de candidatas para Hindica, una marca de ropa artesanal chilena con tiendas en la costa. Evalúa esta entrevista de trabajo.

Las 4 cualidades más importantes para Hindica son:
1. RESPONSABILIDAD — manejo de caja, cuidado de stock, cumplimiento de protocolos
2. CONFIABILIDAD — puntualidad, consistencia, avisa cuando tiene problemas
3. HONESTIDAD — transparencia con errores, con el dinero, con la dueña
4. DISPOSICIÓN — actitud positiva ante el esfuerzo, las reglas y el aprendizaje

ENTREVISTA COMPLETA:
${resumen}

Responde SOLO con JSON válido, sin texto adicional, sin markdown:
{
  "nombre": "nombre de la candidata",
  "recomendacion": "CONTRATAR" o "CONSIDERAR" o "NO CONTRATAR",
  "puntaje_total": número del 1 al 10,
  "responsabilidad": { "puntaje": número 1-10, "comentario": "una oración" },
  "confiabilidad": { "puntaje": número 1-10, "comentario": "una oración" },
  "honestidad": { "puntaje": número 1-10, "comentario": "una oración" },
  "disposicion": { "puntaje": número 1-10, "comentario": "una oración" },
  "resumen": "2-3 oraciones sobre la candidata para la dueña",
  "alerta": "si hay algo preocupante, mencionarlo aquí. Si no hay nada, dejar vacío",
  "punto_fuerte": "la mejor cualidad que mostró",
  "punto_debil": "la principal debilidad o duda"
}`
          }]
        })
      });
      const data = await response.json();
      const text = data.content[0].text;
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setEvaluacion(parsed);
      setStep("gracias");
    } catch (e) {
      setEvaluacion({ error: true });
      setStep("gracias");
    }
  };

  if (step === "bienvenida") return (
    <div style={{ minHeight:"100vh", background:C.dark, fontFamily:"system-ui,-apple-system,sans-serif", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"50px 28px 32px", textAlign:"center" }}>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", letterSpacing:"6px", textTransform:"uppercase", marginBottom:12 }}>PROCESO DE SELECCIÓN</div>
        <div style={{ fontSize:44, fontWeight:900, color:C.white, letterSpacing:"8px" }}>HINDICA</div>
        <div style={{ width:50, height:3, background:C.orange, margin:"18px auto" }}/>
        <div style={{ fontSize:15, color:"rgba(255,255,255,0.6)", lineHeight:1.6, maxWidth:340, margin:"0 auto" }}>
          Gracias por tu interés en ser parte del equipo Hindica 🌿
        </div>
      </div>
      <div style={{ flex:1, background:C.bg, borderRadius:"32px 32px 0 0", padding:"32px 24px" }}>
        <div style={{ background:C.white, borderRadius:20, padding:24, marginBottom:20, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize:18, fontWeight:800, color:C.dark, marginBottom:12 }}>Antes de empezar</div>
          {[
            { icon:"⏱️", text:"Esta entrevista toma unos 10-15 minutos." },
            { icon:"📱", text:"Puedes hacerla desde tu teléfono, en cualquier lugar tranquilo." },
            { icon:"💬", text:"No hay respuestas correctas o incorrectas. Solo sé honesta." },
            { icon:"🔒", text:"Tus respuestas son confidenciales y solo las ve la dueña de Hindica." },
          ].map((item, i) => (
            <div key={i} style={{ display:"flex", gap:14, padding:"12px 0", borderBottom:i<3?`1px solid ${C.border}`:"none" }}>
              <span style={{ fontSize:22, flexShrink:0 }}>{item.icon}</span>
              <div style={{ fontSize:14, color:C.text, lineHeight:1.5 }}>{item.text}</div>
            </div>
          ))}
        </div>
        <button onClick={() => setStep("preguntas")} style={{ ...sBtn(C.orange, true), padding:"20px", fontSize:17, borderRadius:16 }}>
          Comenzar entrevista →
        </button>
        <div style={{ textAlign:"center", marginTop:20 }}>
          <button onClick={() => setShowAdmin(true)} style={{ background:"transparent", border:"none", color:C.muted, fontSize:12, cursor:"pointer", fontFamily:"inherit", textDecoration:"underline" }}>
            Ver resultados (dueña)
          </button>
        </div>
        {showAdmin && (
          <div style={{ marginTop:16, background:C.white, borderRadius:16, padding:20, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>Código de acceso</div>
            <input style={{ ...sInput, marginBottom:12 }} type="password" placeholder="Ingresa el código..." value={adminInput} onChange={e=>setAdminInput(e.target.value)}/>
            <button onClick={() => { if(adminInput === ADMIN_CODE) setStep("resultados"); else alert("Código incorrecto"); }} style={{ ...sBtn(C.dark, true), borderRadius:12, padding:"14px" }}>
              Acceder
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (step === "preguntas") return (
    <div style={{ minHeight:"100vh", background:C.dark, fontFamily:"system-ui,-apple-system,sans-serif", display:"flex", flexDirection:"column" }}>
      <ProgressBar current={current + 1} total={PREGUNTAS.length} />
      <div style={{ flex:1, background:C.bg, borderRadius:"28px 28px 0 0", margin:"20px 0 0", padding:"28px 20px 40px" }}>
        <div style={{ fontSize:11, color:C.orange, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", marginBottom:12 }}>
          {{ responsabilidad:"Responsabilidad", confiabilidad:"Confiabilidad", honestidad:"Honestidad", esfuerzo:"Disposición", motivacion:"Motivación" }[pregunta.criterio] || "Información General"}
        </div>
        <div style={{ fontSize:20, fontWeight:800, color:C.dark, lineHeight:1.4, marginBottom:8 }}>{pregunta.label}</div>
        {pregunta.tipo === "largo" && <div style={{ fontSize:13, color:C.muted, marginBottom:20 }}>Tómate el tiempo que necesitas. Sé específica.</div>}
        {pregunta.tipo === "texto" ? (
          <input style={{ ...sInput, fontSize:16 }} placeholder={pregunta.placeholder} value={valor} onChange={e=>setValor(e.target.value)} autoFocus/>
        ) : (
          <textarea style={{ ...sInput, minHeight:140, fontSize:15 }} placeholder={pregunta.placeholder} value={valor} onChange={e=>setValor(e.target.value)} autoFocus/>
        )}
        <div style={{ marginTop:20, display:"flex", gap:12 }}>
          {current > 0 && (
            <button onClick={() => { setCurrent(c=>c-1); setValor(respuestas[PREGUNTAS[current-1].id]||""); }} style={{ ...sBtn(C.border), color:C.text, borderRadius:12, padding:"16px 20px" }}>
              ← Atrás
            </button>
          )}
          <button disabled={!valor.trim() && pregunta.id !== "algo_mas"} onClick={avanzar} style={{ ...sBtn(valor.trim() || pregunta.id==="algo_mas" ? C.orange : C.border, true), borderRadius:14, padding:"18px", opacity: valor.trim() || pregunta.id==="algo_mas" ? 1 : 0.5 }}>
            {current === PREGUNTAS.length - 1 ? "Enviar entrevista ✓" : "Siguiente →"}
          </button>
        </div>
      </div>
    </div>
  );

  if (step === "evaluando") return (
    <div style={{ minHeight:"100vh", background:C.dark, fontFamily:"system-ui,-apple-system,sans-serif", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32, textAlign:"center" }}>
      <div style={{ fontSize:50, marginBottom:24 }}>🌿</div>
      <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", letterSpacing:"4px", textTransform:"uppercase", marginBottom:16 }}>HINDICA</div>
      <div style={{ fontSize:22, fontWeight:800, color:C.white, marginBottom:12 }}>Procesando tu entrevista…</div>
      <div style={{ fontSize:14, color:"rgba(255,255,255,0.5)", lineHeight:1.7, maxWidth:300 }}>
        Estamos revisando tus respuestas con cuidado. Esto toma solo unos segundos.
      </div>
      <div style={{ marginTop:32, display:"flex", gap:8 }}>
        {[0,1,2].map(i=>(
          <div key={i} style={{ width:10, height:10, borderRadius:"50%", background:C.orange, animation:`pulse${i} 1s ease-in-out infinite`, opacity: 0.4+i*0.3 }}/>
        ))}
      </div>
    </div>
  );

  if (step === "gracias") return (
    <div style={{ minHeight:"100vh", background:C.dark, fontFamily:"system-ui,-apple-system,sans-serif", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32, textAlign:"center" }}>
      <div style={{ fontSize:60, marginBottom:20 }}>✅</div>
      <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", letterSpacing:"4px", textTransform:"uppercase", marginBottom:12 }}>ENTREVISTA COMPLETADA</div>
      <div style={{ fontSize:26, fontWeight:800, color:C.white, marginBottom:8 }}>¡Gracias, {nombre}!</div>
      <div style={{ fontSize:15, color:"rgba(255,255,255,0.55)", lineHeight:1.7, maxWidth:320, marginBottom:36 }}>
        Hemos recibido tu entrevista. La dueña de Hindica la revisará y se pondrá en contacto contigo pronto.
      </div>
      <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:20, padding:24, maxWidth:340, width:"100%" }}>
        <div style={{ fontSize:14, color:"rgba(255,255,255,0.5)", marginBottom:8 }}>Mientras esperas, puedes conocer más sobre Hindica en</div>
        <div style={{ fontSize:16, fontWeight:700, color:C.orange }}>hindica.cl</div>
      </div>
    </div>
  );

  if (step === "resultados" && evaluacion) {
    const colores = { "CONTRATAR": C.green, "CONSIDERAR": C.gold, "NO CONTRATAR": C.red };
    const iconos  = { "CONTRATAR":"✅", "CONSIDERAR":"🟡", "NO CONTRATAR":"❌" };
    const color   = colores[evaluacion.recomendacion] || C.muted;
    const icono   = iconos[evaluacion.recomendacion]  || "❓";

    return (
      <div style={{ background:C.bg, minHeight:"100vh", fontFamily:"system-ui,-apple-system,sans-serif", paddingBottom:40 }}>
        <div style={{ background:C.dark, padding:"24px 20px 28px" }}>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", letterSpacing:"3px", textTransform:"uppercase" }}>HINDICA — PANEL DUEÑA</div>
          <div style={{ fontSize:22, fontWeight:800, color:C.white, marginTop:6 }}>Resultado de Entrevista</div>
          <div style={{ fontSize:14, color:"rgba(255,255,255,0.5)", marginTop:4 }}>{evaluacion.nombre}</div>
        </div>

        <div style={{ padding:"20px 20px 0" }}>
          {/* Recomendación principal */}
          <div style={{ background:color, borderRadius:20, padding:"24px", marginBottom:20, textAlign:"center" }}>
            <div style={{ fontSize:40, marginBottom:8 }}>{icono}</div>
            <div style={{ fontSize:24, fontWeight:900, color:C.white }}>{evaluacion.recomendacion}</div>
            <div style={{ fontSize:18, fontWeight:700, color:"rgba(255,255,255,0.85)", marginTop:4 }}>Puntaje: {evaluacion.puntaje_total}/10</div>
          </div>

          {/* Resumen */}
          <div style={{ background:C.white, borderRadius:16, padding:20, marginBottom:16, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize:16, fontWeight:800, marginBottom:10 }}>📋 Resumen para la dueña</div>
            <div style={{ fontSize:15, color:C.text, lineHeight:1.7 }}>{evaluacion.resumen}</div>
            {evaluacion.alerta && (
              <div style={{ marginTop:14, background:"#FDECEA", borderRadius:10, padding:"12px 14px", fontSize:13, color:C.red, fontWeight:600 }}>
                ⚠️ {evaluacion.alerta}
              </div>
            )}
          </div>

          {/* Scores por criterio */}
          <div style={{ background:C.white, borderRadius:16, padding:20, marginBottom:16, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize:16, fontWeight:800, marginBottom:16 }}>Evaluación por criterio</div>
            {[
              { label:"Responsabilidad", data:evaluacion.responsabilidad, icon:"💼" },
              { label:"Confiabilidad",   data:evaluacion.confiabilidad,   icon:"🕐" },
              { label:"Honestidad",      data:evaluacion.honestidad,      icon:"💎" },
              { label:"Disposición",     data:evaluacion.disposicion,     icon:"💪" },
            ].map(({ label, data, icon }) => {
              if(!data) return null;
              const pct = (data.puntaje / 10) * 100;
              const barColor = pct >= 70 ? C.green : pct >= 50 ? C.gold : C.red;
              return (
                <div key={label} style={{ marginBottom:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <div style={{ fontSize:14, fontWeight:700 }}>{icon} {label}</div>
                    <div style={{ fontSize:14, fontWeight:800, color:barColor }}>{data.puntaje}/10</div>
                  </div>
                  <div style={{ background:"#F0F0F0", borderRadius:6, height:8, marginBottom:6 }}>
                    <div style={{ background:barColor, height:8, borderRadius:6, width:`${pct}%`, transition:"width 0.5s" }}/>
                  </div>
                  <div style={{ fontSize:13, color:C.muted }}>{data.comentario}</div>
                </div>
              );
            })}
          </div>

          {/* Puntos clave */}
          <div style={{ background:C.white, borderRadius:16, padding:20, marginBottom:16, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ display:"flex", gap:12, marginBottom:12 }}>
              <div style={{ flex:1, background:C.lightGreen, borderRadius:12, padding:14 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.green, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>✓ Punto fuerte</div>
                <div style={{ fontSize:13, color:C.text }}>{evaluacion.punto_fuerte}</div>
              </div>
              <div style={{ flex:1, background:"#FDECEA", borderRadius:12, padding:14 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.red, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>⚠ Punto débil</div>
                <div style={{ fontSize:13, color:C.text }}>{evaluacion.punto_debil}</div>
              </div>
            </div>
          </div>

          {/* Respuestas completas */}
          <div style={{ background:C.white, borderRadius:16, padding:20, marginBottom:16, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize:16, fontWeight:800, marginBottom:14 }}>Respuestas completas</div>
            {PREGUNTAS.map((p, i) => (
              <div key={i} style={{ marginBottom:16, paddingBottom:16, borderBottom:i<PREGUNTAS.length-1?`1px solid ${C.border}`:"none" }}>
                <div style={{ fontSize:12, color:C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>Pregunta {i+1}</div>
                <div style={{ fontSize:14, fontWeight:700, color:C.dark, marginBottom:6 }}>{p.label}</div>
                <div style={{ fontSize:14, color:C.text, lineHeight:1.6, background:"#F8F6F2", borderRadius:10, padding:"12px 14px" }}>{respuestas[p.id] || "(sin respuesta)"}</div>
              </div>
            ))}
          </div>

          <button onClick={()=>{ setStep("bienvenida"); setEvaluacion(null); setRespuestas({}); setCurrent(0); }} style={{ ...sBtn(C.dark, true), borderRadius:14, padding:"16px" }}>
            ← Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return null;
}
