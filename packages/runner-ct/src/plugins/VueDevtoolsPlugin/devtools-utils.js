// // export const instanceMap = target.__VUE_DEVTOOLS_INSTANCE_MAP__ = new Map()
// // export const functionalVnodeMap = target.__VUE_DEVTOOLS_FUNCTIONAL_VNODE_MAP__ = new Map()

// // export function findInstanceOrVnode (id) {
// //   if (/:functional:/.test(id)) {
// //     const [refId] = id.split(':functional:')
// //     const map = functionalVnodeMap.get(refId)
// //     return map && map[id]
// //   }
// //   return instanceMap.get(id)
// // }

// // /**
// //  * Scan the page for root level Vue instances.
// //  */

// // function scan () {
// //   rootInstances.length = 0
// //   let inFragment = false
// //   let currentFragment = null

// //   function processInstance (instance) {
// //     if (instance) {
// //       if (rootInstances.indexOf(instance.$root) === -1) {
// //         instance = instance.$root
// //       }
// //       if (instance._isFragment) {
// //         inFragment = true
// //         currentFragment = instance
// //       }

// //       // respect Vue.config.devtools option
// //       let baseVue = instance.constructor
// //       while (baseVue.super) {
// //         baseVue = baseVue.super
// //       }
// //       if (baseVue.config && baseVue.config.devtools) {
// //         // give a unique id to root instance so we can
// //         // 'namespace' its children
// //         if (typeof instance.__VUE_DEVTOOLS_ROOT_UID__ === 'undefined') {
// //           instance.__VUE_DEVTOOLS_ROOT_UID__ = ++rootUID
// //         }
// //         rootInstances.push(instance)
// //       }

// //       return true
// //     }
// //   }

// //   if (isBrowser) {
// //     walk(document, function (node) {
// //       if (inFragment) {
// //         if (node === currentFragment._fragmentEnd) {
// //           inFragment = false
// //           currentFragment = null
// //         }
// //         return true
// //       }
// //       let instance = node.__vue__

// //       return processInstance(instance)
// //     })
// //   } else {
// //     if (Array.isArray(target.__VUE_ROOT_INSTANCES__)) {
// //       target.__VUE_ROOT_INSTANCES__.map(processInstance)
// //     }
// //   }
// //   hook.emit('router:init')
// //   flush()
// // }

// // /**
// //  * DOM walk helper
// //  *
// //  * @param {NodeList} nodes
// //  * @param {Function} fn
// //  */

// // function walk (node, fn) {
// //   if (node.childNodes) {
// //     for (let i = 0, l = node.childNodes.length; i < l; i++) {
// //       const child = node.childNodes[i]
// //       const stop = fn(child)
// //       if (!stop) {
// //         walk(child, fn)
// //       }
// //     }
// //   }

// //   // also walk shadow DOM
// //   if (node.shadowRoot) {
// //     walk(node.shadowRoot, fn)
// //   }
// // }

// // /**
// //  * Called on every Vue.js batcher flush cycle.
// //  * Capture current component tree structure and the state
// //  * of the current inspected instance (if present) and
// //  * send it to the devtools.
// //  */

// // function flush () {
// //   let start
// //   functionalIds.clear()
// //   captureIds.clear()
// //   if (process.env.NODE_ENV !== 'production') {
// //     captureCount = 0
// //     start = isBrowser ? window.performance.now() : 0
// //   }
// //   const payload = stringify({
// //     inspectedInstance: getInstanceDetails(currentInspectedId),
// //     instances: findQualifiedChildrenFromList(rootInstances)
// //   })
// //   if (process.env.NODE_ENV !== 'production') {
// //     console.log(`[flush] serialized ${captureCount} instances${isBrowser ? `, took ${window.performance.now() - start}ms.` : ''}.`)
// //   }
// //   bridge.send('flush', payload)
// // }

// // /**
// //  * Iterate through an array of instances and flatten it into
// //  * an array of qualified instances. This is a depth-first
// //  * traversal - e.g. if an instance is not matched, we will
// //  * recursively go deeper until a qualified child is found.
// //  *
// //  * @param {Array} instances
// //  * @return {Array}
// //  */

// // function findQualifiedChildrenFromList (instances) {
// //   instances = instances
// //     .filter(child => !child._isBeingDestroyed)
// //   return !filter
// //     ? instances.map(capture)
// //     : Array.prototype.concat.apply([], instances.map(findQualifiedChildren))
// // }

// // /**
// //  * Find qualified children from a single instance.
// //  * If the instance itself is qualified, just return itself.
// //  * This is ok because [].concat works in both cases.
// //  *
// //  * @param {Vue|Vnode} instance
// //  * @return {Vue|Array}
// //  */

// // function findQualifiedChildren (instance) {
// //   return isQualified(instance)
// //     ? capture(instance)
// //     : findQualifiedChildrenFromList(instance.$children).concat(
// //       instance._vnode && instance._vnode.children
// //         // Find functional components in recursively in non-functional vnodes.
// //         ? flatten(instance._vnode.children.filter(child => !child.componentInstance).map(captureChild))
// //           // Filter qualified children.
// //           .filter(instance => isQualified(instance))
// //         : []
// //     )
// // }

// // /**
// //  * Check if an instance is qualified.
// //  *
// //  * @param {Vue|Vnode} instance
// //  * @return {Boolean}
// //  */

// // function isQualified (instance) {
// //   const name = classify(instance.name || getInstanceName(instance)).toLowerCase()
// //   return name.indexOf(filter) > -1
// // }

// function flatten (items) {
//   return items.reduce((acc, item) => {
//     if (item instanceof Array) acc.push(...flatten(item))
//     else if (item) acc.push(item)

//     return acc
//   }, [])
// }

// function captureChild (child) {
//   if (child.fnContext && !child.componentInstance) {
//     return capture(child)
//   } else if (child.componentInstance) {
//     if (!child.componentInstance._isBeingDestroyed) {
//       return capture(child.componentInstance)
//     }
//   } else if (child.children) {
//     return flatten(child.children.map(captureChild))
//   }
// }

// /**
//  * Get the appropriate display name for an instance.
//  *
//  * @param {Vue} instance
//  * @return {String}
//  */

// export function getInstanceName (instance) {
//   const name = 'name' // getComponentName(instance.$options || instance.fnOptions || {})
//   if (name) {
//     return name
//   }
//   return instance.$root === instance
//     ? 'Root'
//     : 'Anonymous Component'
// }

// // Dedupe instances
// // Some instances may be both on a component and on a child abstract/functional component
// const captureIds = new Map()
// const instanceMap = new Map()
// const consoleBoundInstances = Array(5)

// window.top.log = () => {
//   // console.log(instanceMap)
//   // console.log(captureIds)
//   return instanceMap
// }

// let captureCount = 0

// /**
//  * Capture the meta information of an instance. (recursive)
//  *
//  * @param {Vue} instance
//  * @return {Object}
//  */

// export function capture (instance, index, list) {
//   if (process.env.NODE_ENV !== 'production') {
//     captureCount++
//   }

//   if (instance.$options && instance.$options.abstract && instance._vnode && instance._vnode.componentInstance) {
//     instance = instance._vnode.componentInstance
//   }

//   // Functional component.
//   if (instance.fnContext && !instance.componentInstance) {
//     const contextUid = instance.fnContext.__VUE_DEVTOOLS_UID__
//     let id = functionalIds.get(contextUid)
//     if (id == null) {
//       id = 0
//     } else {
//       id++
//     }
//     functionalIds.set(contextUid, id)
//     const functionalId = contextUid + ':functional:' + id
//     markFunctional(functionalId, instance)
//     return {
//       id: functionalId,
//       functional: true,
//       name: getInstanceName(instance),
//       renderKey: getRenderKey(instance.key),
//       children: (instance.children ? instance.children.map(
//         child => child.fnContext
//           ? captureChild(child)
//           : child.componentInstance
//             ? capture(child.componentInstance)
//             : undefined
//       )
//         // router-view has both fnContext and componentInstance on vnode.
//         : instance.componentInstance ? [capture(instance.componentInstance)] : []).filter(Boolean),
//       inactive: false,
//       isFragment: false // TODO: Check what is it for.
//     }
//   }
//   // instance._uid is not reliable in devtools as there
//   // may be 2 roots with same _uid which causes unexpected
//   // behaviour
//   instance.__VUE_DEVTOOLS_UID__ = getUniqueId(instance)

//   // Dedupe
//   if (captureIds.has(instance.__VUE_DEVTOOLS_UID__)) {
//     return
//   } else {
//     captureIds.set(instance.__VUE_DEVTOOLS_UID__, undefined)
//   }

//   mark(instance)
//   const name = getInstanceName(instance)

//   const ret = {
//     uid: instance._uid,
//     id: instance.__VUE_DEVTOOLS_UID__,
//     name,
//     renderKey: getRenderKey(instance.$vnode ? instance.$vnode['key'] : null),
//     inactive: !!instance._inactive,
//     isFragment: !!instance._isFragment,
//     children: instance.$children
//       .filter(child => !child._isBeingDestroyed)
//       .map(capture)
//       .filter(Boolean)
//   }

//   if (instance._vnode && instance._vnode.children) {
//     ret.children = ret.children.concat(
//       flatten(instance._vnode.children.map(captureChild))
//         .filter(Boolean)
//     )
//   }

//   // record screen position to ensure correct ordering
//   if ((!list || list.length > 1) && !instance._inactive) {
//     const rect = getInstanceOrVnodeRect(instance)
//     ret.top = rect ? rect.top : Infinity
//   } else {
//     ret.top = Infinity
//   }
//   // check if instance is available in console
//   const consoleId = consoleBoundInstances.indexOf(instance.__VUE_DEVTOOLS_UID__)
//   ret.consoleId = consoleId > -1 ? '$vm' + consoleId : null
//   // check router view
//   const isRouterView2 = instance.$vnode && instance.$vnode.data.routerView
//   if (instance._routerView || isRouterView2) {
//     ret.isRouterView = true
//     if (!instance._inactive && instance.$route) {
//       const matched = instance.$route.matched
//       const depth = isRouterView2
//         ? instance.$vnode.data.routerViewDepth
//         : instance._routerView.depth
//       ret.matchedRouteSegment =
//         matched &&
//         matched[depth] &&
//         (isRouterView2 ? matched[depth].path : matched[depth].handler.path)
//     }
//   }
//   return ret
// }

// /**
//  * Mark an instance as captured and store it in the instance map.
//  *
//  * @param {Vue} instance
//  */

// function mark (instance) {
//   if (!instanceMap.has(instance._uid)) {
//     instanceMap.set(instance._uid, instance)
//     instance.$on('hook:beforeDestroy', function () {
//       instanceMap.delete(instance._uid)
//     })
//   }
// }

// // function markFunctional (id, vnode) {
// //   const refId = vnode.fnContext.__VUE_DEVTOOLS_UID__
// //   if (!functionalVnodeMap.has(refId)) {
// //     functionalVnodeMap.set(refId, {})
// //     vnode.fnContext.$on('hook:beforeDestroy', function () {
// //       functionalVnodeMap.delete(refId)
// //     })
// //   }

// //   functionalVnodeMap.get(refId)[id] = vnode
// // }

// // /**
// //  * Get the detailed information of an inspected instance.
// //  *
// //  * @param {Number} id
// //  */

// // function getInstanceDetails (id) {
// //   const instance = instanceMap.get(id)
// //   if (!instance) {
// //     const vnode = findInstanceOrVnode(id)

// //     if (!vnode) return {}

// //     const data = {
// //       id,
// //       name: getComponentName(vnode.fnOptions),
// //       file: vnode.fnOptions.__file || null,
// //       state: processProps({ $options: vnode.fnOptions, ...(vnode.devtoolsMeta && vnode.devtoolsMeta.renderContext.props) }),
// //       functional: true
// //     }

// //     return data
// //   } else {
// //     const data = {
// //       id: id,
// //       name: getInstanceName(instance),
// //       state: getInstanceState(instance)
// //     }

// //     let i
// //     if ((i = instance.$vnode) && (i = i.componentOptions) && (i = i.Ctor) && (i = i.options)) {
// //       data.file = i.__file || null
// //     }

// //     return data
// //   }
// // }

// // function getInstanceState (instance) {
// //   return processProps(instance).concat(
// //     processState(instance),
// //     processRefs(instance),
// //     processComputed(instance),
// //     processInjected(instance),
// //     processRouteContext(instance),
// //     processVuexGetters(instance),
// //     processFirebaseBindings(instance),
// //     processObservables(instance),
// //     processAttrs(instance)
// //   )
// // }

// // export function getCustomInstanceDetails (instance) {
// //   const state = getInstanceState(instance)
// //   return {
// //     _custom: {
// //       type: 'component',
// //       id: instance.__VUE_DEVTOOLS_UID__,
// //       display: getInstanceName(instance),
// //       tooltip: 'Component instance',
// //       value: reduceStateList(state),
// //       fields: {
// //         abstract: true
// //       }
// //     }
// //   }
// // }

// // export function reduceStateList (list) {
// //   if (!list.length) {
// //     return undefined
// //   }
// //   return list.reduce((map, item) => {
// //     const key = item.type || 'data'
// //     const obj = map[key] = map[key] || {}
// //     obj[item.key] = item.value
// //     return map
// //   }, {})
// // }

// // /**
// //  * Get the appropriate display name for an instance.
// //  *
// //  * @param {Vue} instance
// //  * @return {String}
// //  */

// // export function getInstanceName (instance) {
// //   const name = getComponentName(instance.$options || instance.fnOptions || {})
// //   if (name) return name
// //   return instance.$root === instance
// //     ? 'Root'
// //     : 'Anonymous Component'
// // }

// // /**
// //  * Process the props of an instance.
// //  * Make sure return a plain object because window.postMessage()
// //  * will throw an Error if the passed object contains Functions.
// //  *
// //  * @param {Vue} instance
// //  * @return {Array}
// //  */

// // function processProps (instance) {
// //   let props
// //   if (isLegacy && (props = instance._props)) {
// //     // 1.x
// //     return Object.keys(props).map(key => {
// //       const prop = props[key]
// //       const options = prop.options
// //       return {
// //         type: 'props',
// //         key: prop.path,
// //         value: instance[prop.path],
// //         meta: options ? {
// //           type: options.type ? getPropType(options.type) : 'any',
// //           required: !!options.required,
// //           mode: propModes[prop.mode]
// //         } : {}
// //       }
// //     })
// //   } else if ((props = instance.$options.props)) {
// //     // 2.0
// //     const propsData = []
// //     for (let key in props) {
// //       const prop = props[key]
// //       key = camelize(key)
// //       propsData.push({
// //         type: 'props',
// //         key,
// //         value: instance[key],
// //         meta: prop ? {
// //           type: prop.type ? getPropType(prop.type) : 'any',
// //           required: !!prop.required
// //         } : {
// //           type: 'invalid'
// //         },
// //         editable: SharedData.editableProps
// //       })
// //     }
// //     return propsData
// //   } else {
// //     return []
// //   }
// // }

// // function processAttrs (instance) {
// //   return Object.entries(instance.$attrs || {}).map(([key, value]) => {
// //     return {
// //       type: '$attrs',
// //       key,
// //       value
// //     }
// //   })
// // }

// // /**
// //  * Convert prop type constructor to string.
// //  *
// //  * @param {Function} fn
// //  */

// // const fnTypeRE = /^(?:function|class) (\w+)/
// // function getPropType (type) {
// //   const match = type.toString().match(fnTypeRE)
// //   return typeof type === 'function'
// //     ? (match && match[1]) || 'any'
// //     : 'any'
// // }

// // /**
// //  * Process state, filtering out props and "clean" the result
// //  * with a JSON dance. This removes functions which can cause
// //  * errors during structured clone used by window.postMessage.
// //  *
// //  * @param {Vue} instance
// //  * @return {Array}
// //  */

// // function processState (instance) {
// //   const props = isLegacy
// //     ? instance._props
// //     : instance.$options.props
// //   const getters =
// //     instance.$options.vuex &&
// //     instance.$options.vuex.getters
// //   return Object.keys(instance._data)
// //     .filter(key => (
// //       !(props && key in props) &&
// //       !(getters && key in getters)
// //     ))
// //     .map(key => ({
// //       key,
// //       value: instance._data[key],
// //       editable: true
// //     }))
// // }

// // /**
// //  * Process refs
// //  *
// //  * @param {Vue} instance
// //  * @return {Array}
// //  */

// // function processRefs (instance) {
// //   return Object.keys(instance.$refs)
// //     .filter(key => instance.$refs[key])
// //     .map(key => getCustomRefDetails(instance, key, instance.$refs[key]))
// // }

// // /**
// //  * Process the computed properties of an instance.
// //  *
// //  * @param {Vue} instance
// //  * @return {Array}
// //  */

// // function processComputed (instance) {
// //   const computed = []
// //   const defs = instance.$options.computed || {}
// //   // use for...in here because if 'computed' is not defined
// //   // on component, computed properties will be placed in prototype
// //   // and Object.keys does not include
// //   // properties from object's prototype
// //   for (const key in defs) {
// //     const def = defs[key]
// //     const type = typeof def === 'function' && def.vuex
// //       ? 'vuex bindings'
// //       : 'computed'
// //     // use try ... catch here because some computed properties may
// //     // throw error during its evaluation
// //     let computedProp = null
// //     try {
// //       computedProp = {
// //         type,
// //         key,
// //         value: instance[key]
// //       }
// //     } catch (e) {
// //       computedProp = {
// //         type,
// //         key,
// //         value: '(error during evaluation)'
// //       }
// //     }

// //     computed.push(computedProp)
// //   }

// //   return computed
// // }

// // /**
// //  * Process Vuex getters.
// //  *
// //  * @param {Vue} instance
// //  * @return {Array}
// //  */

// // function processInjected (instance) {
// //   const injected = instance.$options.inject

// //   if (injected) {
// //     return Object.keys(injected).map(key => {
// //       return {
// //         key,
// //         type: 'injected',
// //         value: instance[key]
// //       }
// //     })
// //   } else {
// //     return []
// //   }
// // }

// // /**
// //  * Process possible vue-router $route context
// //  *
// //  * @param {Vue} instance
// //  * @return {Array}
// //  */

// // function processRouteContext (instance) {
// //   try {
// //     const route = instance.$route
// //     if (route) {
// //       const { path, query, params } = route
// //       const value = { path, query, params }
// //       if (route.fullPath) value.fullPath = route.fullPath
// //       if (route.hash) value.hash = route.hash
// //       if (route.name) value.name = route.name
// //       if (route.meta) value.meta = route.meta
// //       return [{
// //         key: '$route',
// //         value: {
// //           _custom: {
// //             type: 'router',
// //             abstract: true,
// //             value
// //           }
// //         }
// //       }]
// //     }
// //   } catch (e) {
// //     // Invalid $router
// //   }
// //   return []
// // }

// // /**
// //  * Process Vuex getters.
// //  *
// //  * @param {Vue} instance
// //  * @return {Array}
// //  */

// // function processVuexGetters (instance) {
// //   const getters =
// //     instance.$options.vuex &&
// //     instance.$options.vuex.getters
// //   if (getters) {
// //     return Object.keys(getters).map(key => {
// //       return {
// //         type: 'vuex getters',
// //         key,
// //         value: instance[key]
// //       }
// //     })
// //   } else {
// //     return []
// //   }
// // }

// // /**
// //  * Process Firebase bindings.
// //  *
// //  * @param {Vue} instance
// //  * @return {Array}
// //  */

// // function processFirebaseBindings (instance) {
// //   const refs = instance.$firebaseRefs
// //   if (refs) {
// //     return Object.keys(refs).map(key => {
// //       return {
// //         type: 'firebase bindings',
// //         key,
// //         value: instance[key]
// //       }
// //     })
// //   } else {
// //     return []
// //   }
// // }

// // /**
// //  * Process vue-rx observable bindings.
// //  *
// //  * @param {Vue} instance
// //  * @return {Array}
// //  */

// // function processObservables (instance) {
// //   const obs = instance.$observables
// //   if (obs) {
// //     return Object.keys(obs).map(key => {
// //       return {
// //         type: 'observables',
// //         key,
// //         value: instance[key]
// //       }
// //     })
// //   } else {
// //     return []
// //   }
// // }

// // /**
// //  * Sroll a node into view.
// //  *
// //  * @param {Vue} instance
// //  */

// // function scrollIntoView (instance) {
// //   const rect = getInstanceOrVnodeRect(instance)
// //   if (rect) {
// //     // TODO: Handle this for non-browser environments.
// //     window.scrollBy(0, rect.top + (rect.height - window.innerHeight) / 2)
// //   }
// // }

// // /**
// //  * Binds given instance in console as $vm0.
// //  * For compatibility reasons it also binds it as $vm.
// //  *
// //  * @param {Vue} instance
// //  */

// // function bindToConsole (instance) {
// //   if (!instance) return
// //   if (!isBrowser) return

// //   const id = instance.__VUE_DEVTOOLS_UID__
// //   const index = consoleBoundInstances.indexOf(id)
// //   if (index > -1) {
// //     consoleBoundInstances.splice(index, 1)
// //   } else {
// //     consoleBoundInstances.pop()
// //   }

// //   consoleBoundInstances.unshift(id)
// //   for (let i = 0; i < 5; i++) {
// //     window['$vm' + i] = instanceMap.get(consoleBoundInstances[i])
// //   }
// //   window.$vm = instance
// // }

// function getInstanceOrVnodeRect (instance) {
//   const el = instance.$el || instance.elm
//   return
//   if (!isBrowser) {
//     // TODO: Find position from instance or a vnode (for functional components).

//     return
//   }
//   // if (!inDoc(el)) {
//   //   return
//   // }
//   // if (instance._isFragment) {
//   //   return getFragmentRect(instance)
//   // } else if (el.nodeType === 1) {
//   //   return el.getBoundingClientRect()
//   // }
// }

// /**
//  * Returns a devtools unique id for instance.
//  * @param {Vue} instance
//  */
// function getUniqueId (instance) {
//   return instance._uid
// }

// function getRenderKey (value) {
//   if (value == null) return
//   const type = typeof value
//   if (type === 'number') {
//     return value
//   } else if (type === 'string') {
//     return `'${value}'`
//   } else if (Array.isArray(value)) {
//     return 'Array'
//   } else {
//     return 'Object'
//   }
// }

// // /**
// //  * Display a toast message.
// //  * @param {any} message HTML content
// //  */
// // export function toast (message, type = 'normal') {
// //   const fn = target.__VUE_DEVTOOLS_TOAST__
// //   fn && fn(message, type)
// // }

// // export function inspectInstance (instance) {
// //   const id = instance.__VUE_DEVTOOLS_UID__
// //   id && bridge.send('inspect-instance', id)
// // }

// // function setStateValue ({ id, path, value, newKey, remove }) {
// //   const instance = instanceMap.get(id)
// //   if (instance) {
// //     try {
// //       let parsedValue
// //       if (value) {
// //         parsedValue = parse(value, true)
// //       }
// //       const api = isLegacy ? {
// //         $set: hook.Vue.set,
// //         $delete: hook.Vue.delete
// //       } : instance
// //       const data = has(instance._props, path, newKey)
// //         ? instance._props
// //         : instance._data
// //       set(data, path, parsedValue, (obj, field, value) => {
// //         (remove || newKey) && api.$delete(obj, field)
// //         !remove && api.$set(obj, newKey || field, value)
// //       })
// //     } catch (e) {
// //       console.error(e)
// //     }
// //   }
// // }

// // function initRightClick () {
// //   if (!isBrowser) return
// //   // Start recording context menu when Vue is detected
// //   // event if Vue devtools are not loaded yet
// //   document.addEventListener('contextmenu', event => {
// //     const el = event.target
// //     if (el) {
// //       // Search for parent that "is" a component instance
// //       const instance = findRelatedComponent(el)
// //       if (instance) {
// //         window.__VUE_DEVTOOLS_CONTEXT_MENU_HAS_TARGET__ = true
// //         window.__VUE_DEVTOOLS_CONTEXT_MENU_TARGET__ = instance
// //         return
// //       }
// //     }
// //     window.__VUE_DEVTOOLS_CONTEXT_MENU_HAS_TARGET__ = null
// //     window.__VUE_DEVTOOLS_CONTEXT_MENU_TARGET__ = null
// //   })
// // }