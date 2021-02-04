
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(anchor = null) {
            this.a = anchor;
            this.e = this.n = null;
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                this.h(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const playerStore = writable([]);
    const playerId = writable('');
    const undercoverCount = writable(0);
    const mrWhiteCount = writable(0);
    const socket = new WebSocket('ws://localhost:3000');
    // socket.addEventListener('open', function (event) {
    //   console.log("It's open");
    // });
    socket.addEventListener('message', onMessageEvent);
    function onMessageEvent(event) {
        console.log(`Received data from WS, ${event.data}`);
        const resp = JSON.parse(event.data);
        if (resp.topic === 'player') {
            if (resp.subtopic === 'update') {
                const addPlayerResponse = resp;
                updatePlayerStore(addPlayerResponse);
            }
        }
        else if (resp.topic === 'settings') {
            const settingsResponse = resp;
            updateSettings(settingsResponse);
        }
    }
    function updateSettings(resp) {
        const data = resp.data;
        undercoverCount.set(data.underCoverCount);
        mrWhiteCount.set(data.mrWhiteCount);
    }
    function updatePlayerStore(resp) {
        // console.log(`Before: ${get(playerStore)}`);
        playerStore.set(resp.data);
        // console.log(`After: ${get(playerStore)}`);
    }
    const sendMessage = (message) => {
        if (socket.readyState <= 1) {
            // console.log(`Sending ${JSON.stringify(message)}`);
            socket.send(JSON.stringify(message));
        }
    };

    function wrapAddPlayerPayload(message) {
        return {
            topic: 'player',
            subtopic: 'add',
            data: message
        };
    }
    function createGetSettingsPayload() {
        return {
            topic: 'settings',
            subtopic: 'get',
        };
    }

    /* src/NameInput.svelte generated by Svelte v3.31.2 */
    const file = "src/NameInput.svelte";

    function create_fragment(ctx) {
    	let main;
    	let label;
    	let t1;
    	let input;
    	let t2;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			label = element("label");
    			label.textContent = "Input name";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			button = element("button");
    			button.textContent = "OK";
    			attr_dev(label, "class", "svelte-3cl2m5");
    			add_location(label, file, 28, 2, 619);
    			attr_dev(input, "type", "text");
    			add_location(input, file, 29, 2, 649);
    			add_location(button, file, 30, 2, 731);
    			add_location(main, file, 26, 0, 551);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, label);
    			append_dev(main, t1);
    			append_dev(main, input);
    			set_input_value(input, /*message*/ ctx[0]);
    			append_dev(main, t2);
    			append_dev(main, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[4]),
    					listen_dev(input, "keyup", prevent_default(/*handleKeyup*/ ctx[2]), false, true, false),
    					listen_dev(button, "click", /*handleClick*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*message*/ 1 && input.value !== /*message*/ ctx[0]) {
    				set_input_value(input, /*message*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let players;
    	let $playerStore;
    	validate_store(playerStore, "playerStore");
    	component_subscribe($$self, playerStore, $$value => $$invalidate(3, $playerStore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("NameInput", slots, []);
    	let message = "";

    	function handleClick() {
    		if (message.length > 0) {
    			if (players.indexOf(message) === -1) {
    				sendMessage(wrapAddPlayerPayload(message));
    				playerId.set(message);
    			} else {
    				alert("This name has already been picked!");
    			}
    		}
    	}

    	function handleKeyup() {
    		if (event.code === "Enter") {
    			handleClick();
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NameInput> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		message = this.value;
    		$$invalidate(0, message);
    	}

    	$$self.$capture_state = () => ({
    		sendMessage,
    		playerId,
    		playerStore,
    		wrapAddPlayerPayload,
    		message,
    		handleClick,
    		handleKeyup,
    		players,
    		$playerStore
    	});

    	$$self.$inject_state = $$props => {
    		if ("message" in $$props) $$invalidate(0, message = $$props.message);
    		if ("players" in $$props) players = $$props.players;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$playerStore*/ 8) {
    			 players = $playerStore;
    		}
    	};

    	return [message, handleClick, handleKeyup, $playerStore, input_input_handler];
    }

    class NameInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NameInput",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/PlayerList.svelte generated by Svelte v3.31.2 */
    const file$1 = "src/PlayerList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (12:4) {#each players as player}
    function create_each_block(ctx) {
    	let p;
    	let html_tag;
    	let raw_value = formatName(/*$playerId*/ ctx[1], /*player*/ ctx[3]) + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = space();
    			html_tag = new HtmlTag(t);
    			add_location(p, file$1, 12, 6, 328);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			html_tag.m(raw_value, p);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$playerId, players*/ 3 && raw_value !== (raw_value = formatName(/*$playerId*/ ctx[1], /*player*/ ctx[3]) + "")) html_tag.p(raw_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(12:4) {#each players as player}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let h3;
    	let t1;
    	let each_value = /*players*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			h3 = element("h3");
    			h3.textContent = "Connected players";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h3, file$1, 10, 2, 263);
    			add_location(main, file$1, 9, 0, 254);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h3);
    			append_dev(main, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*formatName, $playerId, players*/ 3) {
    				each_value = /*players*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(main, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function formatName(playerId, currentPlayer) {
    	return playerId === currentPlayer
    	? `<b> ${currentPlayer} <b>`
    	: currentPlayer;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let players;
    	let $playerStore;
    	let $playerId;
    	validate_store(playerStore, "playerStore");
    	component_subscribe($$self, playerStore, $$value => $$invalidate(2, $playerStore = $$value));
    	validate_store(playerId, "playerId");
    	component_subscribe($$self, playerId, $$value => $$invalidate(1, $playerId = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PlayerList", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PlayerList> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		playerStore,
    		playerId,
    		formatName,
    		players,
    		$playerStore,
    		$playerId
    	});

    	$$self.$inject_state = $$props => {
    		if ("players" in $$props) $$invalidate(0, players = $$props.players);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$playerStore*/ 4) {
    			 $$invalidate(0, players = $playerStore);
    		}
    	};

    	return [players, $playerId, $playerStore];
    }

    class PlayerList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PlayerList",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/Settings.svelte generated by Svelte v3.31.2 */
    const file$2 = "src/Settings.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let h3;
    	let t1;
    	let p0;
    	let t3;
    	let button0;
    	let t5;
    	let t6;
    	let t7;
    	let button1;
    	let t9;
    	let p1;
    	let t11;
    	let button2;
    	let t13;
    	let t14;
    	let t15;
    	let button3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h3 = element("h3");
    			h3.textContent = "Settings";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Undercover";
    			t3 = space();
    			button0 = element("button");
    			button0.textContent = `${"<"}`;
    			t5 = space();
    			t6 = text(/*$undercoverCount*/ ctx[0]);
    			t7 = space();
    			button1 = element("button");
    			button1.textContent = `${">"}`;
    			t9 = space();
    			p1 = element("p");
    			p1.textContent = "Mr White";
    			t11 = space();
    			button2 = element("button");
    			button2.textContent = `${"<"}`;
    			t13 = space();
    			t14 = text(/*$mrWhiteCount*/ ctx[1]);
    			t15 = space();
    			button3 = element("button");
    			button3.textContent = `${">"}`;
    			add_location(h3, file$2, 27, 2, 512);
    			add_location(p0, file$2, 28, 2, 534);
    			attr_dev(button0, "class", "svelte-17dw75w");
    			add_location(button0, file$2, 29, 2, 554);
    			attr_dev(button1, "class", "svelte-17dw75w");
    			add_location(button1, file$2, 31, 2, 658);
    			add_location(p1, file$2, 32, 2, 741);
    			attr_dev(button2, "class", "svelte-17dw75w");
    			add_location(button2, file$2, 33, 2, 759);
    			attr_dev(button3, "class", "svelte-17dw75w");
    			add_location(button3, file$2, 35, 2, 855);
    			add_location(main, file$2, 26, 0, 503);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h3);
    			append_dev(main, t1);
    			append_dev(main, p0);
    			append_dev(main, t3);
    			append_dev(main, button0);
    			append_dev(main, t5);
    			append_dev(main, t6);
    			append_dev(main, t7);
    			append_dev(main, button1);
    			append_dev(main, t9);
    			append_dev(main, p1);
    			append_dev(main, t11);
    			append_dev(main, button2);
    			append_dev(main, t13);
    			append_dev(main, t14);
    			append_dev(main, t15);
    			append_dev(main, button3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[3], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[4], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[5], false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$undercoverCount*/ 1) set_data_dev(t6, /*$undercoverCount*/ ctx[0]);
    			if (dirty & /*$mrWhiteCount*/ 2) set_data_dev(t14, /*$mrWhiteCount*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $undercoverCount;
    	let $mrWhiteCount;
    	validate_store(undercoverCount, "undercoverCount");
    	component_subscribe($$self, undercoverCount, $$value => $$invalidate(0, $undercoverCount = $$value));
    	validate_store(mrWhiteCount, "mrWhiteCount");
    	component_subscribe($$self, mrWhiteCount, $$value => $$invalidate(1, $mrWhiteCount = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Settings", slots, []);

    	function updateValue(subtopic, data) {
    		sendMessage({ topic: "settings", subtopic, data });
    	}

    	onMount(() => {
    		sendMessage(createGetSettingsPayload());
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Settings> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => updateValue("undercover", "decrement");
    	const click_handler_1 = () => updateValue("undercover", "increment");
    	const click_handler_2 = () => updateValue("white", "decrement");
    	const click_handler_3 = () => updateValue("white", "increment");

    	$$self.$capture_state = () => ({
    		onMount,
    		undercoverCount,
    		mrWhiteCount,
    		sendMessage,
    		createGetSettingsPayload,
    		updateValue,
    		$undercoverCount,
    		$mrWhiteCount
    	});

    	return [
    		$undercoverCount,
    		$mrWhiteCount,
    		updateValue,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class Settings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/StartButton.svelte generated by Svelte v3.31.2 */
    const file$3 = "src/StartButton.svelte";

    function create_fragment$3(ctx) {
    	let button;
    	let t;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text("Start");
    			button.disabled = /*disabledButton*/ ctx[0];
    			add_location(button, file$3, 19, 0, 642);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*disabledButton*/ 1) {
    				prop_dev(button, "disabled", /*disabledButton*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function canStartGame(ucCount, mrWhiteCount, playerNumber) {
    	let specialCharacterCount = ucCount + mrWhiteCount;
    	const otherCount = playerNumber - specialCharacterCount;

    	if (playerNumber < 3 || specialCharacterCount === 0 || specialCharacterCount >= playerNumber) {
    		return false;
    	}

    	return otherCount >= 2;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let playerNumbers;
    	let disabledButton;
    	let $playerStore;
    	let $undercoverCount;
    	let $mrWhiteCount;
    	validate_store(playerStore, "playerStore");
    	component_subscribe($$self, playerStore, $$value => $$invalidate(2, $playerStore = $$value));
    	validate_store(undercoverCount, "undercoverCount");
    	component_subscribe($$self, undercoverCount, $$value => $$invalidate(3, $undercoverCount = $$value));
    	validate_store(mrWhiteCount, "mrWhiteCount");
    	component_subscribe($$self, mrWhiteCount, $$value => $$invalidate(4, $mrWhiteCount = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("StartButton", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<StartButton> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		undercoverCount,
    		mrWhiteCount,
    		playerStore,
    		canStartGame,
    		playerNumbers,
    		$playerStore,
    		disabledButton,
    		$undercoverCount,
    		$mrWhiteCount
    	});

    	$$self.$inject_state = $$props => {
    		if ("playerNumbers" in $$props) $$invalidate(1, playerNumbers = $$props.playerNumbers);
    		if ("disabledButton" in $$props) $$invalidate(0, disabledButton = $$props.disabledButton);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$playerStore*/ 4) {
    			// let errMsg = '';
    			 $$invalidate(1, playerNumbers = $playerStore.length);
    		}

    		if ($$self.$$.dirty & /*$undercoverCount, $mrWhiteCount, playerNumbers*/ 26) {
    			 $$invalidate(0, disabledButton = !canStartGame($undercoverCount, $mrWhiteCount, playerNumbers));
    		}
    	};

    	return [disabledButton, playerNumbers, $playerStore, $undercoverCount, $mrWhiteCount];
    }

    class StartButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StartButton",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/Lobby.svelte generated by Svelte v3.31.2 */
    const file$4 = "src/Lobby.svelte";

    // (10:1) {#if !addedName}
    function create_if_block_1(ctx) {
    	let nameinput;
    	let current;
    	nameinput = new NameInput({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(nameinput.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(nameinput, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(nameinput.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(nameinput.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(nameinput, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(10:1) {#if !addedName}",
    		ctx
    	});

    	return block;
    }

    // (15:2) {#if addedName}
    function create_if_block(ctx) {
    	let settings;
    	let t0;
    	let br;
    	let t1;
    	let startbutton;
    	let current;
    	settings = new Settings({ $$inline: true });
    	startbutton = new StartButton({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(settings.$$.fragment);
    			t0 = space();
    			br = element("br");
    			t1 = space();
    			create_component(startbutton.$$.fragment);
    			add_location(br, file$4, 16, 4, 392);
    		},
    		m: function mount(target, anchor) {
    			mount_component(settings, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(startbutton, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(settings.$$.fragment, local);
    			transition_in(startbutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(settings.$$.fragment, local);
    			transition_out(startbutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(settings, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t1);
    			destroy_component(startbutton, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(15:2) {#if addedName}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let main;
    	let t0;
    	let playerlist;
    	let t1;
    	let br;
    	let t2;
    	let current;
    	let if_block0 = !/*addedName*/ ctx[0] && create_if_block_1(ctx);
    	playerlist = new PlayerList({ $$inline: true });
    	let if_block1 = /*addedName*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			create_component(playerlist.$$.fragment);
    			t1 = space();
    			br = element("br");
    			t2 = space();
    			if (if_block1) if_block1.c();
    			add_location(br, file$4, 13, 2, 348);
    			add_location(main, file$4, 8, 0, 281);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t0);
    			mount_component(playerlist, main, null);
    			append_dev(main, t1);
    			append_dev(main, br);
    			append_dev(main, t2);
    			if (if_block1) if_block1.m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*addedName*/ ctx[0]) {
    				if (if_block0) {
    					if (dirty & /*addedName*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(main, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*addedName*/ ctx[0]) {
    				if (if_block1) {
    					if (dirty & /*addedName*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(main, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(playerlist.$$.fragment, local);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(playerlist.$$.fragment, local);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			destroy_component(playerlist);
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let addedName;
    	let $playerId;
    	validate_store(playerId, "playerId");
    	component_subscribe($$self, playerId, $$value => $$invalidate(1, $playerId = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Lobby", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Lobby> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		NameInput,
    		PlayerList,
    		Settings,
    		StartButton,
    		playerId,
    		addedName,
    		$playerId
    	});

    	$$self.$inject_state = $$props => {
    		if ("addedName" in $$props) $$invalidate(0, addedName = $$props.addedName);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$playerId*/ 2) {
    			 $$invalidate(0, addedName = $playerId !== "");
    		}
    	};

    	return [addedName, $playerId];
    }

    class Lobby extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Lobby",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.31.2 */
    const file$5 = "src/App.svelte";

    function create_fragment$5(ctx) {
    	let main;
    	let lobby;
    	let current;
    	lobby = new Lobby({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(lobby.$$.fragment);
    			attr_dev(main, "class", "svelte-1fanpjj");
    			add_location(main, file$5, 3, 0, 65);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(lobby, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(lobby.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(lobby.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(lobby);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Lobby });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
