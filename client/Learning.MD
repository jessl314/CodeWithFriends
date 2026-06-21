1. for a block statement like {TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        
                    )
                })} there must be a return statement in order to dynamically render this portion of the component

string | undefined in terms of the parameters for a typescript function -> type annotation, the parameter can be string or undefined


=== strict equality in TS, compares value and data type

== will try to perform implicit type coercion 

so false == "0" -> since 0 is falsy

empty arrays/structures are truthy in TS/JS -> must check length in this case if we want empty array to by falsy


passing in an empty array [] -> useEffect has no dependencies so it only runs once when the component first mounts/loads on screen



