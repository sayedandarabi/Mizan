import React, {useEffect, useMemo, useState} from "react";
import {
  SafeAreaView, View, Text, ScrollView, Pressable, TextInput, StyleSheet,
  useWindowDimensions, StatusBar, Alert, KeyboardAvoidingView, Platform
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Decimal from "decimal.js";
import {palette as C} from "./src/ui/theme";
import {messages, Language, MessageKey} from "./src/i18n/messages";
import {Customer, getCustomers, saveCustomer} from "./src/services/customerStore";
import {Invoice, getInvoices, saveInvoice, InvoiceStatus} from "./src/services/invoiceStore";

type Page = "dashboard"|"customers"|"invoices"|"detail";
type Mode = "lite"|"pro"|"business";
const digits = (v:string|number, lang:Language) => {
 const locale = lang==="dari" ? "fa-AF" : lang==="pashto" ? "ps-AF" : "en-US";
 try { return new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(Number(v)); } catch { return String(v); }
};
const money = (v:string|number, currency:"AFN"|"USD", lang:Language) =>
 `${digits(v,lang)} ${currency==="AFN"?(lang==="english"?"AFN":lang==="pashto"?"افغانۍ":"افغانی"):"USD"}`;
const today = () => new Date().toISOString().slice(0,10);

export default function App(){
 const {width,height} = useWindowDimensions();
 const [lang,setLang] = useState<Language>("dari");
 const [mode,setMode] = useState<Mode>("lite");
 const [page,setPage] = useState<Page>("dashboard");
 const [customers,setCustomers] = useState<Customer[]>([]);
 const [invoices,setInvoices] = useState<Invoice[]>([]);
 const [selected,setSelected] = useState<Invoice|null>(null);
 const [filter,setFilter] = useState<"all"|InvoiceStatus>("all");
 const [showCustomerForm,setShowCustomerForm] = useState(false);
 const [showInvoiceForm,setShowInvoiceForm] = useState(false);
 const [customerName,setCustomerName] = useState("");
 const [phone,setPhone] = useState("");
 const [address,setAddress] = useState("");
 const [invoiceCustomer,setInvoiceCustomer] = useState("");
 const [item,setItem] = useState("");
 const [quantity,setQuantity] = useState("1");
 const [rate,setRate] = useState("0");
 const [currency,setCurrency] = useState<"AFN"|"USD">("AFN");
 const [dueAt,setDueAt] = useState(today());
 const [search,setSearch] = useState("");
 const [ready,setReady] = useState(false);
 const t = messages[lang];
 const rtl = lang!=="english";
 const compact = width < 380;
 const columns = width >= 720 ? 3 : 2;

 useEffect(()=>{(async()=>{
   const savedLang=await AsyncStorage.getItem("hesab.v6.language");
   if(savedLang==="dari"||savedLang==="pashto"||savedLang==="english") setLang(savedLang);
   const savedMode=await AsyncStorage.getItem("hesab.v6.mode");
   if(savedMode==="lite"||savedMode==="pro"||savedMode==="business") setMode(savedMode);
   setCustomers(await getCustomers()); setInvoices(await getInvoices()); setReady(true);
 })().catch(e=>Alert.alert("Storage",String(e)));},[]);
 const changeLang=async(v:Language)=>{setLang(v);await AsyncStorage.setItem("hesab.v6.language",v);};
 const changeMode=async(v:Mode)=>{setMode(v);await AsyncStorage.setItem("hesab.v6.mode",v);};
 const addCustomer=async()=>{
   if(!customerName.trim()){Alert.alert(t.name,t.customerName);return;}
   const c:Customer={id:Date.now().toString(),name:customerName.trim(),phone:phone.trim(),address:address.trim(),createdAt:new Date().toISOString()};
   await saveCustomer(c);setCustomers(await getCustomers());setCustomerName("");setPhone("");setAddress("");setShowCustomerForm(false);
 };
 const addInvoice=async()=>{
   if(!invoiceCustomer.trim()||!item.trim()||!Decimal.max(0,rate||"0").isFinite()){Alert.alert(t.invoice,t.noData);return;}
   const total=new Decimal(quantity||"1").mul(rate||"0");
   if(total.isNegative()||total.isZero()){Alert.alert(t.amount,t.noData);return;}
   const inv:Invoice={id:Date.now().toString(),number:`INV-${String(invoices.length+1).padStart(5,"0")}`,customer:invoiceCustomer.trim(),item:item.trim(),quantity,rate,total:total.toFixed(2),currency,createdAt:today(),dueAt,status:"pending"};
   await saveInvoice(inv);setInvoices(await getInvoices());setShowInvoiceForm(false);setPage("invoices");setInvoiceCustomer("");setItem("");setQuantity("1");setRate("0");
 };
 const filteredInvoices=useMemo(()=>invoices.filter(i=>filter==="all"||i.status===filter),[invoices,filter]);
 const totalSales=invoices.reduce((a,i)=>a.add(i.total),new Decimal(0));
 const cardWidth = `${100/columns-(columns===2?2:1)}%` as any;
 const txt=(key:MessageKey)=>t[key] as string;
 const Header=({title,back}:{title:string;back?:()=>void})=><View style={[s.header,{flexDirection:rtl?"row-reverse":"row"}]}>
   <Pressable onPress={back||(()=>setPage("dashboard"))} style={s.round}><Text style={s.roundText}>{rtl?"›":"‹"}</Text></Pressable>
   <View style={{flex:1,alignItems:rtl?"flex-end":"flex-start"}}><Text style={s.headerTitle}>{title}</Text><Text style={s.sub}>{txt("tagline")}</Text></View>
   <View style={s.logo}><Text style={s.logoText}>ح</Text></View>
 </View>;
 const Pill=({label,active,onPress}:{label:string;active:boolean;onPress:()=>void})=><Pressable onPress={onPress} style={[s.pill,active&&s.pillActive]}><Text style={[s.pillText,active&&s.pillTextActive]}>{label}</Text></Pressable>;
 const Metric=({label,value,color=C.accent,wide=false}:{label:string;value:string;color?:string;wide?:boolean})=><View style={[s.metric,{width:wide?"100%":cardWidth}]}>
   <View style={[s.dot,{backgroundColor:color}]} /><Text style={s.metricLabel}>{label}</Text><Text numberOfLines={1} adjustsFontSizeToFit style={s.metricValue}>{value}</Text>
 </View>;
 const Field=({label,value,onChange,placeholder,keyboard="default"}:{label:string;value:string;onChange:(v:string)=>void;placeholder?:string;keyboard?:"default"|"numeric"|"phone-pad"})=><View style={s.field}>
   <Text style={[s.fieldLabel,{textAlign:rtl?"right":"left"}]}>{label}</Text>
   <TextInput value={value} onChangeText={onChange} placeholder={placeholder||label} placeholderTextColor={C.muted} keyboardType={keyboard} style={[s.input,{textAlign:rtl?"right":"left",writingDirection:rtl?"rtl":"ltr"}]}/>
 </View>;
 const bottomNav=()=> <View style={[s.nav,{flexDirection:rtl?"row-reverse":"row"}]}>
   {(["dashboard","customers","invoices"] as Page[]).map((p,i)=><Pressable key={p} onPress={()=>{setPage(p);setShowCustomerForm(false);setShowInvoiceForm(false);}} style={s.navItem}>
     <Text style={[s.navIcon,page===p&&s.navSelected]}>{["⌂","◎","▤"][i]}</Text><Text style={[s.navText,page===p&&s.navSelected]}>{txt(p==="dashboard"?"dashboard":p==="customers"?"customers":"invoices")}</Text>
   </Pressable>)}
 </View>;

 return <SafeAreaView style={s.safe}>
  <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
  {!ready?<View style={s.loading}><Text style={s.headerTitle}>{txt("app")}</Text></View>:<>
   {page==="dashboard"&&<ScrollView contentContainerStyle={[s.page,{paddingHorizontal:compact?14:22,maxWidth:900,alignSelf:"center",width:"100%"}]}>
     <Header title={txt("app")}/>
     <View style={[s.hero,{alignItems:rtl?"flex-end":"flex-start"}]}>
       <Text style={s.eyebrow}>{txt("welcome")}</Text><Text style={s.heroTitle}>{txt("today")}</Text><Text style={s.sub}>{txt("dashboardHint")}</Text>
     </View>
     <View style={[s.switchRow,{flexDirection:rtl?"row-reverse":"row"}]}>
       <Text style={s.sectionLabel}>{txt("mode")}</Text>
       <View style={[s.pillGroup,{flexDirection:rtl?"row-reverse":"row"}]}>
         <Pill label={txt("lite")} active={mode==="lite"} onPress={()=>changeMode("lite")}/>
         <Pill label={txt("pro")} active={mode==="pro"} onPress={()=>changeMode("pro")}/>
         <Pill label={txt("business")} active={mode==="business"} onPress={()=>changeMode("business")}/>
       </View>
     </View>
     <View style={[s.switchRow,{flexDirection:rtl?"row-reverse":"row"}]}>
       <Text style={s.sectionLabel}>{txt("language")}</Text>
       <View style={[s.pillGroup,{flexDirection:rtl?"row-reverse":"row"}]}>
         <Pill label="دری" active={lang==="dari"} onPress={()=>changeLang("dari")}/>
         <Pill label="پښتو" active={lang==="pashto"} onPress={()=>changeLang("pashto")}/>
         <Pill label="EN" active={lang==="english"} onPress={()=>changeLang("english")}/>
       </View>
     </View>
     <Text style={[s.sectionTitle,{textAlign:rtl?"right":"left"}]}>{txt("today")}</Text>
     <View style={[s.metrics,{flexDirection:rtl?"row-reverse":"row"}]}>
       <Metric label={txt("sales")} value={money(totalSales.toFixed(2),currency,lang)} color={C.blue}/>
       <Metric label={txt("expenses")} value={money("0",currency,lang)} color={C.purple}/>
       <Metric label={txt("receivable")} value={money(totalSales.toFixed(2),currency,lang)} color={C.accent}/>
       <Metric label={txt("customers")} value={digits(customers.length,lang)} color={C.orange}/>
       {mode!=="lite"&&<Metric label={txt("capital")} value={money("0",currency,lang)} color={C.green}/>}
       {mode==="business"&&<Metric label={txt("inventory")} value={money("0",currency,lang)} color={C.white}/>}
     </View>
     <Text style={[s.sectionTitle,{textAlign:rtl?"right":"left"}]}>{txt("customersLeads")}</Text>
     <View style={[s.actionRow,{flexDirection:rtl?"row-reverse":"row"}]}>
       <Pressable onPress={()=>setPage("customers")} style={s.actionCard}><Text style={s.actionIcon}>◎</Text><Text style={s.actionTitle}>{txt("customers")}</Text><Text style={s.actionHint}>{digits(customers.length,lang)}</Text></Pressable>
       <Pressable onPress={()=>setPage("invoices")} style={s.actionCard}><Text style={s.actionIcon}>▤</Text><Text style={s.actionTitle}>{txt("invoices")}</Text><Text style={s.actionHint}>{digits(invoices.length,lang)}</Text></Pressable>
       <Pressable onPress={()=>setShowInvoiceForm(true)} style={s.actionCard}><Text style={s.actionIcon}>＋</Text><Text style={s.actionTitle}>{txt("createInvoice")}</Text><Text style={s.actionHint}>＋</Text></Pressable>
     </View>
     <Text style={s.disclaimer}>{txt("sample")}</Text>
   </ScrollView>}

   {page==="customers"&&<ScrollView contentContainerStyle={[s.page,{maxWidth:900,alignSelf:"center",width:"100%"}]}>
     <Header title={txt("customers")} back={()=>setPage("dashboard")}/>
     <View style={[s.sectionHead,{flexDirection:rtl?"row-reverse":"row"}]}><Text style={s.sectionTitle}>{txt("customersLeads")}</Text><Pressable onPress={()=>setShowCustomerForm(v=>!v)} style={s.addButton}><Text style={s.addButtonText}>＋ {txt("addCustomer")}</Text></Pressable></View>
     <Field label={txt("search")} value={search} onChange={setSearch}/>
     {showCustomerForm&&<View style={s.formCard}><Field label={txt("name")} value={customerName} onChange={setCustomerName}/><Field label={txt("phone")} value={phone} onChange={setPhone} keyboard="phone-pad"/><Field label={txt("address")} value={address} onChange={setAddress}/><View style={[s.actionRow,{flexDirection:rtl?"row-reverse":"row"}]}><Pressable onPress={()=>setShowCustomerForm(false)} style={s.secondary}><Text style={s.secondaryText}>{txt("cancel")}</Text></Pressable><Pressable onPress={addCustomer} style={s.primary}><Text style={s.primaryText}>{txt("save")}</Text></Pressable></View></View>}
     {customers.filter(c=>(c.name+" "+c.phone).toLowerCase().includes(search.toLowerCase())).map(c=><View key={c.id} style={[s.listCard,{flexDirection:rtl?"row-reverse":"row"}]}>
       <View style={s.avatar}><Text style={s.avatarText}>{c.name.slice(0,1)}</Text></View><View style={{flex:1,alignItems:rtl?"flex-end":"flex-start"}}><Text style={s.personName}>{c.name}</Text><Text style={s.sub}>{c.phone||c.address||"—"}</Text></View><Text style={s.chevron}>{rtl?"‹":"›"}</Text>
     </View>)}
     {customers.length===0&&!showCustomerForm&&<Text style={s.empty}>{txt("noCustomers")}</Text>}
   </ScrollView>}

   {page==="invoices"&&<ScrollView contentContainerStyle={[s.page,{maxWidth:900,alignSelf:"center",width:"100%"}]}>
     <Header title={txt("invoices")} back={()=>setPage("dashboard")}/>
     <View style={[s.sectionHead,{flexDirection:rtl?"row-reverse":"row"}]}><Text style={s.sectionTitle}>{txt("invoices")}</Text><Pressable onPress={()=>setShowInvoiceForm(v=>!v)} style={s.addButton}><Text style={s.addButtonText}>＋ {txt("createInvoice")}</Text></Pressable></View>
     <View style={[s.pillGroup,{flexDirection:rtl?"row-reverse":"row",flexWrap:"wrap"}]}>
       {(["all","pending","progress","paid","overdue"] as const).map(f=><Pill key={f} label={txt(f)} active={filter===f} onPress={()=>setFilter(f)}/>)}
     </View>
     {showInvoiceForm&&<View style={s.formCard}>
       <Field label={txt("customerName")} value={invoiceCustomer} onChange={setInvoiceCustomer} placeholder={customers[0]?.name||txt("customerName")}/>
       <Field label={txt("itemName")} value={item} onChange={setItem}/>
       <View style={[s.actionRow,{flexDirection:rtl?"row-reverse":"row"}]}><View style={{flex:1}}><Field label={txt("qty")} value={quantity} onChange={setQuantity} keyboard="numeric"/></View><View style={{flex:1}}><Field label={txt("rate")} value={rate} onChange={setRate} keyboard="numeric"/></View></View>
       <View style={[s.pillGroup,{flexDirection:rtl?"row-reverse":"row"}]}><Pill label={txt("afn")} active={currency==="AFN"} onPress={()=>setCurrency("AFN")}/><Pill label={txt("usd")} active={currency==="USD"} onPress={()=>setCurrency("USD")}/></View>
       <Field label={txt("dueDate")} value={dueAt} onChange={setDueAt} placeholder="YYYY-MM-DD"/>
       <View style={s.totalBar}><Text style={s.metricLabel}>{txt("total")}</Text><Text style={s.totalText}>{money(new Decimal(quantity||"0").mul(rate||"0").toFixed(2),currency,lang)}</Text></View>
       <View style={[s.actionRow,{flexDirection:rtl?"row-reverse":"row"}]}><Pressable onPress={()=>setShowInvoiceForm(false)} style={s.secondary}><Text style={s.secondaryText}>{txt("cancel")}</Text></Pressable><Pressable onPress={addInvoice} style={s.primary}><Text style={s.primaryText}>{txt("save")}</Text></Pressable></View>
     </View>}
     {filteredInvoices.map(inv=><Pressable key={inv.id} onPress={()=>{setSelected(inv);setPage("detail");}} style={s.invoiceCard}>
       <View style={[s.invoiceTop,{flexDirection:rtl?"row-reverse":"row"}]}><View style={s.avatar}><Text style={s.avatarText}>{inv.customer.slice(0,1)}</Text></View><View style={{flex:1,alignItems:rtl?"flex-end":"flex-start"}}><Text style={s.personName}>{inv.customer}</Text><Text style={s.sub}>#{inv.number} · {inv.createdAt}</Text></View><Text style={s.chevron}>{rtl?"↗":"↗"}</Text></View>
       <Text style={s.invoiceAmount}>{money(inv.total,inv.currency,lang)}</Text>
       <View style={[s.invoiceBottom,{flexDirection:rtl?"row-reverse":"row"}]}><Text style={s.sub}>{inv.item} · {txt(inv.status)}</Text><Text style={s.invoiceButton}>{txt("invoice")}</Text></View>
     </Pressable>)}
     {invoices.length===0&&!showInvoiceForm&&<Text style={s.empty}>{txt("noInvoices")}</Text>}
   </ScrollView>}

   {page==="detail"&&selected&&<ScrollView contentContainerStyle={[s.page,{maxWidth:760,alignSelf:"center",width:"100%"}]}>
     <Header title={txt("invoice")} back={()=>setPage("invoices")}/>
     <View style={s.invoicePaper}>
       <View style={[s.invoicePaperTop,{flexDirection:rtl?"row-reverse":"row"}]}><View style={s.invoiceSeal}><Text style={s.sealText}>ح</Text></View><View style={{alignItems:rtl?"flex-end":"flex-start"}}><Text style={s.paperHeading}>{txt("invoice")}</Text><Text style={s.paperMuted}>#{selected.number}</Text></View></View>
       <Text style={[s.paperCustomer,{textAlign:rtl?"right":"left"}]}>{selected.customer}</Text><Text style={[s.paperMuted,{textAlign:rtl?"right":"left"}]}>{selected.item}</Text>
       <View style={s.paperDivider}/>
       <View style={[s.paperLine,{flexDirection:rtl?"row-reverse":"row"}]}><Text style={s.paperMuted}>{txt("qty")}</Text><Text style={s.paperText}>{digits(selected.quantity,lang)}</Text></View>
       <View style={[s.paperLine,{flexDirection:rtl?"row-reverse":"row"}]}><Text style={s.paperMuted}>{txt("rate")}</Text><Text style={s.paperText}>{money(selected.rate,selected.currency,lang)}</Text></View>
       <View style={[s.paperLine,{flexDirection:rtl?"row-reverse":"row"}]}><Text style={s.paperMuted}>{txt("invoiceDate")}</Text><Text style={s.paperText}>{selected.createdAt}</Text></View>
       <View style={[s.paperLine,{flexDirection:rtl?"row-reverse":"row"}]}><Text style={s.paperMuted}>{txt("dueDate")}</Text><Text style={s.paperText}>{selected.dueAt}</Text></View>
       <View style={s.paperDivider}/>
       <View style={[s.paperTotal,{flexDirection:rtl?"row-reverse":"row"}]}><Text style={s.paperText}>{txt("total")}</Text><Text style={s.paperTotalValue}>{money(selected.total,selected.currency,lang)}</Text></View>
       <View style={[s.paperLine,{flexDirection:rtl?"row-reverse":"row"}]}><Text style={s.paperMuted}>{txt("balance")}</Text><Text style={s.paperText}>{money(selected.total,selected.currency,lang)}</Text></View>
     </View>
   </ScrollView>}
   {page!=="detail"&&bottomNav()}
  </>}
 </SafeAreaView>;
}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},page:{paddingHorizontal:18,paddingTop:12,paddingBottom:112,gap:18},
 loading:{flex:1,alignItems:"center",justifyContent:"center"},
 header:{alignItems:"center",gap:12,paddingVertical:10},
 round:{width:42,height:42,borderRadius:22,backgroundColor:"#292C23",alignItems:"center",justifyContent:"center"},
 roundText:{color:C.text,fontSize:28,marginTop:-4},headerTitle:{fontSize:21,fontWeight:"800",color:C.text},sub:{fontSize:12,color:C.muted,marginTop:4},
 logo:{width:43,height:43,borderRadius:22,backgroundColor:C.accent,alignItems:"center",justifyContent:"center"},logoText:{fontSize:22,fontWeight:"900",color:C.accentInk},
 hero:{backgroundColor:C.panel,borderRadius:25,padding:20,borderWidth:1,borderColor:C.line,gap:6},
 eyebrow:{color:C.accent,fontSize:12,fontWeight:"700"},heroTitle:{fontSize:25,fontWeight:"800",color:C.text},
 switchRow:{alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap"},sectionLabel:{color:C.muted,fontSize:12,fontWeight:"700"},
 pillGroup:{gap:6,alignItems:"center"},pill:{backgroundColor:C.panel2,borderRadius:24,paddingHorizontal:13,paddingVertical:9,borderWidth:1,borderColor:C.line},
 pillActive:{backgroundColor:C.text,borderColor:C.text},pillText:{color:C.muted,fontSize:12,fontWeight:"700"},pillTextActive:{color:C.black},
 sectionTitle:{fontSize:18,fontWeight:"800",color:C.text,marginTop:3},
 metrics:{flexWrap:"wrap",justifyContent:"space-between",gap:8},
 metric:{backgroundColor:C.olive,borderRadius:25,minHeight:116,padding:14,justifyContent:"space-between",borderWidth:1,borderColor:"#616749"},
 dot:{width:13,height:13,borderRadius:7,backgroundColor:C.accent,marginBottom:5},
 metricLabel:{fontSize:12,color:"#D0D2C4",fontWeight:"600"},metricValue:{fontSize:21,color:C.text,fontWeight:"700",marginTop:10},
 actionRow:{gap:9,flexWrap:"wrap"},
 actionCard:{flex:1,minWidth:95,backgroundColor:C.panel,borderRadius:20,padding:15,borderWidth:1,borderColor:C.line,gap:8},
 actionIcon:{color:C.accent,fontSize:25},actionTitle:{color:C.text,fontWeight:"700",fontSize:13},actionHint:{color:C.muted,fontSize:12},
 disclaimer:{color:C.muted,fontSize:11,textAlign:"center",marginTop:12},
 nav:{position:"absolute",bottom:0,left:0,right:0,backgroundColor:"#11130F",borderTopWidth:1,borderTopColor:C.line,paddingTop:11,paddingBottom:14,justifyContent:"space-around"},
 navItem:{alignItems:"center",gap:4,flex:1},navIcon:{fontSize:21,color:C.muted},navSelected:{color:C.accent},navText:{fontSize:11,color:C.muted},
 sectionHead:{alignItems:"center",justifyContent:"space-between",gap:8},addButton:{backgroundColor:C.accent,borderRadius:18,paddingHorizontal:13,paddingVertical:10},addButtonText:{color:C.accentInk,fontWeight:"800",fontSize:12},
 field:{gap:6,flex:1},fieldLabel:{color:C.muted,fontSize:12,fontWeight:"700"},input:{backgroundColor:C.panel,borderColor:C.line,borderWidth:1,borderRadius:14,paddingHorizontal:13,paddingVertical:12,color:C.text,fontSize:14},
 formCard:{backgroundColor:C.panel2,borderRadius:22,padding:15,gap:13,borderWidth:1,borderColor:C.line},
 primary:{backgroundColor:C.accent,borderRadius:14,padding:14,alignItems:"center",flex:1},primaryText:{color:C.accentInk,fontWeight:"900"},
 secondary:{backgroundColor:C.panel,borderRadius:14,padding:14,alignItems:"center",flex:1,borderWidth:1,borderColor:C.line},secondaryText:{color:C.text,fontWeight:"700"},
 listCard:{backgroundColor:C.olive,borderRadius:21,padding:14,alignItems:"center",gap:12,borderWidth:1,borderColor:"#62684A"},
 avatar:{width:44,height:44,borderRadius:23,backgroundColor:C.accent,alignItems:"center",justifyContent:"center"},avatarText:{color:C.accentInk,fontSize:18,fontWeight:"900"},
 personName:{color:C.text,fontSize:15,fontWeight:"800"},chevron:{fontSize:24,color:C.text},empty:{color:C.muted,textAlign:"center",padding:30},
 invoiceCard:{backgroundColor:C.olive,borderRadius:24,padding:16,gap:12,borderWidth:1,borderColor:"#606749"},
 invoiceTop:{alignItems:"center",gap:10},invoiceAmount:{fontSize:28,fontWeight:"800",color:C.text,marginTop:4},
 invoiceBottom:{alignItems:"center",justifyContent:"space-between",borderTopWidth:1,borderTopColor:"#6B7153",paddingTop:12},
 invoiceButton:{color:C.accentInk,backgroundColor:C.accent,borderRadius:18,overflow:"hidden",paddingHorizontal:13,paddingVertical:8,fontWeight:"800",fontSize:12},
 totalBar:{backgroundColor:C.accent,borderRadius:17,padding:14,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},
 totalText:{color:C.accentInk,fontWeight:"900",fontSize:18},
 invoicePaper:{backgroundColor:"#8C8E7E",borderRadius:28,padding:20,gap:14,borderWidth:1,borderColor:"#D3D4C8"},
 invoicePaperTop:{alignItems:"center",justifyContent:"space-between"},invoiceSeal:{width:52,height:52,borderRadius:28,backgroundColor:C.accent,alignItems:"center",justifyContent:"center"},
 sealText:{color:C.black,fontWeight:"900",fontSize:25},paperHeading:{color:"#10110D",fontSize:20,fontWeight:"900"},paperMuted:{color:"#45483B",fontSize:12},
 paperCustomer:{color:"#11120E",fontSize:20,fontWeight:"800"},paperText:{color:"#171811",fontSize:14,fontWeight:"700"},
 paperDivider:{height:1,backgroundColor:"#66695B",marginVertical:6},paperLine:{justifyContent:"space-between",alignItems:"center",paddingVertical:7},
 paperTotal:{backgroundColor:C.accent,borderRadius:18,padding:14,justifyContent:"space-between",alignItems:"center"},
 paperTotalValue:{color:C.black,fontWeight:"900",fontSize:19}
});
