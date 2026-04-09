Erro: Ao tentar entrar na tab Logs em `settings.tsx` ele mostra o seguinte erro:
*`Runtime Error`*

**TypeError:** Cannot read properties of null (*reading 'name'*)

*pages/settings.tsx **(389:108)** @ eval*
  387 |                           </div>
  388 |                           <p className="text-zinc-500 mt-1 font-bold">{log.details}</p>
> 389 |                           <p className="text-[9px] font-black text-blue-600 uppercase mt-2">Por: {log.user.name || log.user.email}</p>
      |                                                                                                            ^
  390 |                         </div>
  391 |                       </div>
  392 |                     ))
