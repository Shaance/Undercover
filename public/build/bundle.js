
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
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
    function empty() {
        return text('');
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

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    function create_animation(node, from, fn, params) {
        if (!from)
            return noop;
        const to = node.getBoundingClientRect();
        if (from.left === to.left && from.right === to.right && from.top === to.top && from.bottom === to.bottom)
            return noop;
        const { delay = 0, duration = 300, easing = identity, 
        // @ts-ignore todo: should this be separated from destructuring? Or start/end added to public api and documentation?
        start: start_time = now() + delay, 
        // @ts-ignore todo:
        end = start_time + duration, tick = noop, css } = fn(node, { from, to }, params);
        let running = true;
        let started = false;
        let name;
        function start() {
            if (css) {
                name = create_rule(node, 0, 1, duration, delay, easing, css);
            }
            if (!delay) {
                started = true;
            }
        }
        function stop() {
            if (css)
                delete_rule(node, name);
            running = false;
        }
        loop(now => {
            if (!started && now >= start_time) {
                started = true;
            }
            if (started && now >= end) {
                tick(1, 0);
                stop();
            }
            if (!running) {
                return false;
            }
            if (started) {
                const p = now - start_time;
                const t = 0 + 1 * easing(p / duration);
                tick(t, 1 - t);
            }
            return true;
        });
        start();
        tick(0, 1);
        return stop;
    }
    function fix_position(node) {
        const style = getComputedStyle(node);
        if (style.position !== 'absolute' && style.position !== 'fixed') {
            const { width, height } = style;
            const a = node.getBoundingClientRect();
            node.style.position = 'absolute';
            node.style.width = width;
            node.style.height = height;
            add_transform(node, a);
        }
    }
    function add_transform(node, a) {
        const b = node.getBoundingClientRect();
        if (a.left !== b.left || a.top !== b.top) {
            const style = getComputedStyle(node);
            const transform = style.transform === 'none' ? '' : style.transform;
            node.style.transform = `${transform} translate(${a.left - b.left}px, ${a.top - b.top}px)`;
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

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
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
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function fix_and_destroy_block(block, lookup) {
        block.f();
        destroy_block(block, lookup);
    }
    function fix_and_outro_and_destroy_block(block, lookup) {
        block.f();
        outro_and_destroy_block(block, lookup);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
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
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.32.1' }, detail)));
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

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }
    function quintOut(t) {
        return --t * t * t * t * t + 1;
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }
    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }
    function crossfade(_a) {
        var { fallback } = _a, defaults = __rest(_a, ["fallback"]);
        const to_receive = new Map();
        const to_send = new Map();
        function crossfade(from, node, params) {
            const { delay = 0, duration = d => Math.sqrt(d) * 30, easing = cubicOut } = assign(assign({}, defaults), params);
            const to = node.getBoundingClientRect();
            const dx = from.left - to.left;
            const dy = from.top - to.top;
            const dw = from.width / to.width;
            const dh = from.height / to.height;
            const d = Math.sqrt(dx * dx + dy * dy);
            const style = getComputedStyle(node);
            const transform = style.transform === 'none' ? '' : style.transform;
            const opacity = +style.opacity;
            return {
                delay,
                duration: is_function(duration) ? duration(d) : duration,
                easing,
                css: (t, u) => `
				opacity: ${t * opacity};
				transform-origin: top left;
				transform: ${transform} translate(${u * dx}px,${u * dy}px) scale(${t + (1 - t) * dw}, ${t + (1 - t) * dh});
			`
            };
        }
        function transition(items, counterparts, intro) {
            return (node, params) => {
                items.set(params.key, {
                    rect: node.getBoundingClientRect()
                });
                return () => {
                    if (counterparts.has(params.key)) {
                        const { rect } = counterparts.get(params.key);
                        counterparts.delete(params.key);
                        return crossfade(rect, node, params);
                    }
                    // if the node is disappearing altogether
                    // (i.e. wasn't claimed by the other list)
                    // then we need to supply an outro
                    items.delete(params.key);
                    return fallback && fallback(node, params, intro);
                };
            };
        }
        return [
            transition(to_send, to_receive, false),
            transition(to_receive, to_send, true)
        ];
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
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
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function wrapAddPlayerPayload(message) {
        return {
            topic: 'player',
            subtopic: 'add',
            data: message
        };
    }
    function getPlayersPayload() {
        return {
            topic: 'player',
            subtopic: 'get',
        };
    }
    function createGetSettingsPayload() {
        return {
            topic: 'settings',
            subtopic: 'get',
        };
    }
    function getAddWordPayload(word) {
        return {
            topic: 'game',
            subtopic: 'add',
            data: word
        };
    }
    function guessWordPayload(word) {
        return {
            topic: 'vote',
            subtopic: 'guess',
            data: word
        };
    }
    function getGameInfoPayload() {
        return {
            topic: 'game',
            subtopic: 'update'
        };
    }
    function getVoteAgainstPayload(player) {
        return {
            topic: 'vote',
            subtopic: 'against',
            data: player
        };
    }
    function getVoteResultPayload() {
        return {
            topic: 'vote',
            subtopic: 'result'
        };
    }

    var Role;
    (function (Role) {
        Role["UNDERCOVER"] = "Undercover";
        Role["MR_WHITE"] = "Mr. White";
        Role["OTHER"] = "Civilian";
    })(Role || (Role = {}));
    var Status;
    (function (Status) {
        Status["LOBBY"] = "LOBBY";
        Status["PLAYING"] = "PLAYING";
        Status["VOTING"] = "VOTING";
        Status["FINISHED_VOTING"] = "FINISHED_VOTING";
        Status["DRAW_VOTE"] = "DRAW_VOTE";
        Status["MR_WHITE_GUESS_WAITING"] = "MR_WHITE_GUESS_WAITING";
        Status["WON"] = "WON";
        Status["LOST"] = "LOST";
    })(Status || (Status = {}));

    const playerStore = writable([]);
    const playerId = writable('');
    const undercoverCount = writable(0);
    const mrWhiteCount = writable(0);
    const connectionOpened = writable(false);
    const ownWord = writable('init');
    const playingState = writable('init');
    const playerToWords = writable([]);
    const currentPlayerTurn = writable('');
    const votedOutPlayers = writable([]);
    const currentTurn = writable(0);
    const voteResult = writable({
        turn: 0,
        result: 'DRAW',
        gameState: Status.PLAYING
    });
    const playersWhoVoted = writable([]);
    const isMrWhite = derived(ownWord, ($ownWord) => $ownWord === '');
    const hasVoted = derived([playersWhoVoted, playerId], ([$playersWhoVoted, $playerId]) => $playersWhoVoted.indexOf($playerId) !== -1);
    const playerLost = derived([votedOutPlayers, playerId], ([$votedOutPlayers, $playerId]) => $votedOutPlayers.indexOf($playerId) !== -1);
    const stillInGamePlayers = derived([votedOutPlayers, playerStore], ([$votedOutPlayers, $playerStore]) => $playerStore.filter((p) => $votedOutPlayers.indexOf(p) === -1));
    const usedWords = derived(playerToWords, ($playerToWords) => {
        return new Set($playerToWords.reduce((acc, pToWords) => {
            return acc.concat(pToWords[1].map(word => word.toLowerCase()));
        }, []));
    });
    const yourTurn = derived([currentPlayerTurn, playerId], ([$currentPlayerTurn, $playerId]) => $currentPlayerTurn === $playerId);
    // TODO put ws url into env variable, possible bug in Vercel
    // @ts-ignore
    console.log('{"env":{"API_URL":"ws://localhost:8080","NODE_TLS_REJECT_UNAUTHORIZED":"0"}} + ' + {"env":{"API_URL":"ws://localhost:8080","NODE_TLS_REJECT_UNAUTHORIZED":"0"}}.env.API_URL);
    // @ts-ignore
    const socket = new WebSocket({"env":{"API_URL":"ws://localhost:8080","NODE_TLS_REJECT_UNAUTHORIZED":"0"}}.env.API_URL);
    socket.addEventListener('open', () => connectionOpened.set(true));
    socket.addEventListener('message', onMessageEvent);
    function onMessageEvent(event) {
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
        else if (resp.topic === 'game') {
            if (resp.subtopic === 'word') {
                const getWordResp = resp;
                ownWord.set(getWordResp.data);
                playingState.set('started');
            }
            else if (resp.subtopic === 'update') {
                const inGameResponse = resp;
                const data = inGameResponse.data;
                playerToWords.set(data.playerToWords);
                currentTurn.set(data.turn);
                currentPlayerTurn.set(data.player);
                if (data.state === Status.VOTING) {
                    console.log(`Switching to voting mode!
        playingState: ${get_store_value(playingState)},
        hasVoted: ${get_store_value(hasVoted)},
        playersWhoVoted: ${get_store_value(playersWhoVoted)}
        `);
                    playingState.set('voting');
                }
            }
        }
        else if (resp.topic === 'vote') {
            if (resp.subtopic === 'update') {
                const response = resp;
                console.log(`Updating playersWhoVoted ${get_store_value(playersWhoVoted)}`);
                console.log(`hasVoted ${get_store_value(hasVoted)}`);
                playersWhoVoted.set(response.data.playersWhoVoted);
                console.log(`Updated playersWhoVoted ${get_store_value(playersWhoVoted)}`);
                console.log(`hasVoted ${get_store_value(hasVoted)}`);
                if (response.data.state === Status.FINISHED_VOTING || response.data.state === Status.MR_WHITE_GUESS_WAITING) {
                    sendMessage(getVoteResultPayload());
                }
            }
            else if (resp.subtopic === 'result') {
                const response = resp;
                voteResult.set(response.data);
                playingState.set('result');
            }
            else if (resp.subtopic === 'guess') {
                const response = resp;
                let newVoteResult = get_store_value(voteResult);
                newVoteResult.gameState = response.data;
                voteResult.set(newVoteResult);
            }
        }
        console.log(`Logging stores after message
  playingState: ${get_store_value(playingState)},
  voteResult: ${JSON.stringify(get_store_value(voteResult))},
  currentTurn: ${get_store_value(currentTurn)},
  playersWhoVoted: ${get_store_value(playersWhoVoted)},
  votedOutPlayers: ${get_store_value(votedOutPlayers)},
  playerLost: ${get_store_value(playerLost)},
  `);
    }
    function updateSettings(resp) {
        const data = resp.data;
        undercoverCount.set(data.underCoverCount);
        mrWhiteCount.set(data.mrWhiteCount);
    }
    function updatePlayerStore(resp) {
        playerStore.set(resp.data);
    }
    const sendMessage = (message) => {
        if (get_store_value(connectionOpened)) {
            socket.send(JSON.stringify(message));
        }
    };

    const [s, r] = crossfade({
        duration: d => Math.sqrt(d * 200),
        fallback(node) {
            const style = getComputedStyle(node);
            const transform = style.transform === 'none' ? '' : style.transform;
            return {
                duration: 600,
                easing: quintOut,
                css: t => `
        transform: ${transform} scale(${t});
        opacity: ${t}
      `
            };
        }
    });
    const send = s;
    const receive = r;

    function flip(node, animation, params = {}) {
        const style = getComputedStyle(node);
        const transform = style.transform === 'none' ? '' : style.transform;
        const scaleX = animation.from.width / node.clientWidth;
        const scaleY = animation.from.height / node.clientHeight;
        const dx = (animation.from.left - animation.to.left) / scaleX;
        const dy = (animation.from.top - animation.to.top) / scaleY;
        const d = Math.sqrt(dx * dx + dy * dy);
        const { delay = 0, duration = (d) => Math.sqrt(d) * 120, easing = cubicOut } = params;
        return {
            delay,
            duration: is_function(duration) ? duration(d) : duration,
            easing,
            css: (_t, u) => `transform: ${transform} translate(${u * dx}px, ${u * dy}px);`
        };
    }

    /* src/PlayersGrid.svelte generated by Svelte v3.32.1 */
    const file = "src/PlayersGrid.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (18:6) {#each entry[1] as word, _ (word)}
    function create_each_block_1(key_1, ctx) {
    	let p;
    	let t_value = /*word*/ ctx[5] + "";
    	let t;
    	let p_intro;
    	let rect;
    	let stop_animation = noop;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "item svelte-5fw120");
    			add_location(p, file, 18, 8, 614);
    			this.first = p;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*$playerToWords*/ 1 && t_value !== (t_value = /*word*/ ctx[5] + "")) set_data_dev(t, t_value);
    		},
    		r: function measure() {
    			rect = p.getBoundingClientRect();
    		},
    		f: function fix() {
    			fix_position(p);
    			stop_animation();
    		},
    		a: function animate() {
    			stop_animation();
    			stop_animation = create_animation(p, rect, flip, {});
    		},
    		i: function intro(local) {
    			if (!p_intro) {
    				add_render_callback(() => {
    					p_intro = create_in_transition(p, receive, { key: /*word*/ ctx[5] });
    					p_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(18:6) {#each entry[1] as word, _ (word)}",
    		ctx
    	});

    	return block;
    }

    // (14:2) {#each $playerToWords as entry}
    function create_each_block(ctx) {
    	let div1;
    	let div0;
    	let raw_value = getPlayerText(/*$votedOutPlayers*/ ctx[1], /*entry*/ ctx[2][0]) + "";
    	let t0;
    	let p;
    	let t2;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t3;
    	let each_value_1 = /*entry*/ ctx[2][1];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*word*/ ctx[5];
    	validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			p = element("p");
    			p.textContent = "* * *";
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			add_location(div0, file, 15, 6, 485);
    			attr_dev(p, "class", "svelte-5fw120");
    			add_location(p, file, 16, 6, 552);
    			attr_dev(div1, "class", "card svelte-5fw120");
    			add_location(div1, file, 14, 4, 460);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			div0.innerHTML = raw_value;
    			append_dev(div1, t0);
    			append_dev(div1, p);
    			append_dev(div1, t2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div1, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$votedOutPlayers, $playerToWords*/ 3 && raw_value !== (raw_value = getPlayerText(/*$votedOutPlayers*/ ctx[1], /*entry*/ ctx[2][0]) + "")) div0.innerHTML = raw_value;
    			if (dirty & /*$playerToWords*/ 1) {
    				each_value_1 = /*entry*/ ctx[2][1];
    				validate_each_argument(each_value_1);
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
    				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, div1, fix_and_destroy_block, create_each_block_1, t3, get_each_context_1);
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].a();
    			}
    		},
    		i: function intro(local) {
    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(14:2) {#each $playerToWords as entry}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let each_value = /*$playerToWords*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(main, "class", "svelte-5fw120");
    			add_location(main, file, 12, 0, 415);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$playerToWords, getPlayerText, $votedOutPlayers*/ 3) {
    				each_value = /*$playerToWords*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(main, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
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

    function getPlayerText(votedOutPlayers, player) {
    	if (votedOutPlayers.indexOf(player) !== -1) {
    		return `<div style="color: grey;"><s>${player}</s></div>`;
    	}

    	return `<div>${player}</div>`;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $playerToWords;
    	let $votedOutPlayers;
    	validate_store(playerToWords, "playerToWords");
    	component_subscribe($$self, playerToWords, $$value => $$invalidate(0, $playerToWords = $$value));
    	validate_store(votedOutPlayers, "votedOutPlayers");
    	component_subscribe($$self, votedOutPlayers, $$value => $$invalidate(1, $votedOutPlayers = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PlayersGrid", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PlayersGrid> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		playerToWords,
    		votedOutPlayers,
    		receive,
    		flip,
    		getPlayerText,
    		$playerToWords,
    		$votedOutPlayers
    	});

    	return [$playerToWords, $votedOutPlayers];
    }

    class PlayersGrid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PlayersGrid",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/PlayerTurn.svelte generated by Svelte v3.32.1 */
    const file$1 = "src/PlayerTurn.svelte";

    function create_fragment$1(ctx) {
    	let main;
    	let h2;
    	let t;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h2 = element("h2");
    			t = text(/*turnText*/ ctx[0]);
    			attr_dev(h2, "class", "svelte-1ml2o7h");
    			add_location(h2, file$1, 11, 2, 294);
    			attr_dev(main, "class", "svelte-1ml2o7h");
    			add_location(main, file$1, 10, 0, 285);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h2);
    			append_dev(h2, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*turnText*/ 1) set_data_dev(t, /*turnText*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
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

    function instance$1($$self, $$props, $$invalidate) {
    	let turnText;
    	let $currentPlayerTurn;
    	let $playerId;
    	validate_store(currentPlayerTurn, "currentPlayerTurn");
    	component_subscribe($$self, currentPlayerTurn, $$value => $$invalidate(1, $currentPlayerTurn = $$value));
    	validate_store(playerId, "playerId");
    	component_subscribe($$self, playerId, $$value => $$invalidate(2, $playerId = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PlayerTurn", slots, []);

    	function getText(currentPlayer) {
    		if ($playerId === currentPlayer) {
    			return `It's your turn!`;
    		}

    		return `It's ${currentPlayer}'s turn`;
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PlayerTurn> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		currentPlayerTurn,
    		playerId,
    		getText,
    		turnText,
    		$currentPlayerTurn,
    		$playerId
    	});

    	$$self.$inject_state = $$props => {
    		if ("turnText" in $$props) $$invalidate(0, turnText = $$props.turnText);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$currentPlayerTurn*/ 2) {
    			$$invalidate(0, turnText = getText($currentPlayerTurn));
    		}
    	};

    	return [turnText, $currentPlayerTurn];
    }

    class PlayerTurn extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PlayerTurn",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/Word.svelte generated by Svelte v3.32.1 */
    const file$2 = "src/Word.svelte";

    // (8:2) {:else}
    function create_else_block(ctx) {
    	let h2;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "You are Mr.White!";
    			attr_dev(h2, "class", "svelte-1g6vkai");
    			add_location(h2, file$2, 8, 4, 152);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(8:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (5:2) {#if $ownWord}
    function create_if_block(ctx) {
    	let h2;
    	let t1;
    	let h3;
    	let t2;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Your word is";
    			t1 = space();
    			h3 = element("h3");
    			t2 = text(/*$ownWord*/ ctx[0]);
    			attr_dev(h2, "class", "svelte-1g6vkai");
    			add_location(h2, file$2, 5, 4, 92);
    			attr_dev(h3, "class", "svelte-1g6vkai");
    			add_location(h3, file$2, 6, 4, 118);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$ownWord*/ 1) set_data_dev(t2, /*$ownWord*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(5:2) {#if $ownWord}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let main;

    	function select_block_type(ctx, dirty) {
    		if (/*$ownWord*/ ctx[0]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if_block.c();
    			add_location(main, file$2, 3, 0, 64);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if_block.m(main, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(main, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_block.d();
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
    	let $ownWord;
    	validate_store(ownWord, "ownWord");
    	component_subscribe($$self, ownWord, $$value => $$invalidate(0, $ownWord = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Word", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Word> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ ownWord, $ownWord });
    	return [$ownWord];
    }

    class Word extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Word",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/WordInput.svelte generated by Svelte v3.32.1 */
    const file$3 = "src/WordInput.svelte";

    function create_fragment$3(ctx) {
    	let main;
    	let input_1;
    	let t0;
    	let button;
    	let t1;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			input_1 = element("input");
    			t0 = space();
    			button = element("button");
    			t1 = text("Submit");
    			attr_dev(input_1, "type", "text");
    			attr_dev(input_1, "placeholder", /*placeHolderText*/ ctx[3]);
    			attr_dev(input_1, "class", "svelte-prh7qb");
    			add_location(input_1, file$3, 35, 2, 909);
    			button.disabled = button_disabled_value = !/*$yourTurn*/ ctx[1];
    			attr_dev(button, "class", "svelte-prh7qb");
    			add_location(button, file$3, 42, 2, 1062);
    			attr_dev(main, "class", "svelte-prh7qb");
    			add_location(main, file$3, 34, 0, 900);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, input_1);
    			/*input_1_binding*/ ctx[9](input_1);
    			set_input_value(input_1, /*message*/ ctx[2]);
    			append_dev(main, t0);
    			append_dev(main, button);
    			append_dev(button, t1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input_1, "input", /*input_1_input_handler*/ ctx[10]),
    					listen_dev(input_1, "keyup", prevent_default(/*handleKeyup*/ ctx[5]), false, true, false),
    					listen_dev(button, "click", /*handleClick*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*placeHolderText*/ 8) {
    				attr_dev(input_1, "placeholder", /*placeHolderText*/ ctx[3]);
    			}

    			if (dirty & /*message*/ 4 && input_1.value !== /*message*/ ctx[2]) {
    				set_input_value(input_1, /*message*/ ctx[2]);
    			}

    			if (dirty & /*$yourTurn*/ 2 && button_disabled_value !== (button_disabled_value = !/*$yourTurn*/ ctx[1])) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			/*input_1_binding*/ ctx[9](null);
    			mounted = false;
    			run_all(dispose);
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

    function instance$3($$self, $$props, $$invalidate) {
    	let placeHolderText;
    	let $isMrWhite;
    	let $ownWord;
    	let $yourTurn;
    	let $usedWords;
    	validate_store(isMrWhite, "isMrWhite");
    	component_subscribe($$self, isMrWhite, $$value => $$invalidate(7, $isMrWhite = $$value));
    	validate_store(ownWord, "ownWord");
    	component_subscribe($$self, ownWord, $$value => $$invalidate(8, $ownWord = $$value));
    	validate_store(yourTurn, "yourTurn");
    	component_subscribe($$self, yourTurn, $$value => $$invalidate(1, $yourTurn = $$value));
    	validate_store(usedWords, "usedWords");
    	component_subscribe($$self, usedWords, $$value => $$invalidate(11, $usedWords = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("WordInput", slots, []);
    	let message = "";
    	let input;
    	let mounted = false;
    	onMount(() => $$invalidate(6, mounted = true));

    	// TODO check if word not already seen
    	function handleClick() {
    		const trimmedWord = message.trim();

    		if (trimmedWord.length > 0) {
    			if ($usedWords.has(trimmedWord.toLowerCase())) {
    				alert(`${trimmedWord} has already been used!`);
    			} else {
    				sendMessage(getAddWordPayload(trimmedWord));
    			}

    			$$invalidate(2, message = "");
    		}
    	}

    	function handleKeyup() {
    		// @ts-ignore
    		if (event.code === "Enter") {
    			handleClick();
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<WordInput> was created with unknown prop '${key}'`);
    	});

    	function input_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			input = $$value;
    			$$invalidate(0, input);
    		});
    	}

    	function input_1_input_handler() {
    		message = this.value;
    		$$invalidate(2, message);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		isMrWhite,
    		ownWord,
    		sendMessage,
    		usedWords,
    		yourTurn,
    		getAddWordPayload,
    		message,
    		input,
    		mounted,
    		handleClick,
    		handleKeyup,
    		placeHolderText,
    		$isMrWhite,
    		$ownWord,
    		$yourTurn,
    		$usedWords
    	});

    	$$self.$inject_state = $$props => {
    		if ("message" in $$props) $$invalidate(2, message = $$props.message);
    		if ("input" in $$props) $$invalidate(0, input = $$props.input);
    		if ("mounted" in $$props) $$invalidate(6, mounted = $$props.mounted);
    		if ("placeHolderText" in $$props) $$invalidate(3, placeHolderText = $$props.placeHolderText);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$isMrWhite, $ownWord*/ 384) {
    			$$invalidate(3, placeHolderText = $isMrWhite
    			? "Try to describe.."
    			: `Describe ${$ownWord}`);
    		}

    		if ($$self.$$.dirty & /*$yourTurn, mounted, input*/ 67) {
    			if ($yourTurn && mounted) {
    				input.focus();
    			}
    		}
    	};

    	return [
    		input,
    		$yourTurn,
    		message,
    		placeHolderText,
    		handleClick,
    		handleKeyup,
    		mounted,
    		$isMrWhite,
    		$ownWord,
    		input_1_binding,
    		input_1_input_handler
    	];
    }

    class WordInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WordInput",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /**
     * This will help prevent the 'jumping' animations
     * https://stackoverflow.com/questions/59882179/svelte-transition-between-two-elements-jumps
     */
    function statefulSwap(initialState) {
        const state = writable(initialState);
        let nextState = initialState;
        function transitionTo(newState) {
            if (nextState === newState)
                return;
            nextState = newState;
            state.set(null);
        }
        function onOutro() {
            state.set(nextState);
        }
        return {
            state,
            transitionTo,
            onOutro
        };
    }

    /* src/VotePicker.svelte generated by Svelte v3.32.1 */
    const file$4 = "src/VotePicker.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (12:4) {#if player !== $playerId}
    function create_if_block$1(ctx) {
    	let p;
    	let button;
    	let t0_value = /*player*/ ctx[5] + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[4](/*player*/ ctx[5]);
    	}

    	const block = {
    		c: function create() {
    			p = element("p");
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(button, "class", "svelte-ymjgq6");
    			add_location(button, file$4, 13, 8, 389);
    			add_location(p, file$4, 12, 6, 377);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, button);
    			append_dev(button, t0);
    			append_dev(p, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*players*/ 1 && t0_value !== (t0_value = /*player*/ ctx[5] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(12:4) {#if player !== $playerId}",
    		ctx
    	});

    	return block;
    }

    // (11:2) {#each players as player, _ (player)}
    function create_each_block$1(key_1, ctx) {
    	let first;
    	let if_block_anchor;
    	let if_block = /*player*/ ctx[5] !== /*$playerId*/ ctx[1] && create_if_block$1(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*player*/ ctx[5] !== /*$playerId*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(11:2) {#each players as player, _ (player)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let main;
    	let h2;
    	let t1;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_value = /*players*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*player*/ ctx[5];
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			h2 = element("h2");
    			h2.textContent = "Vote against";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h2, "class", "svelte-ymjgq6");
    			add_location(h2, file$4, 9, 2, 278);
    			add_location(main, file$4, 8, 0, 269);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h2);
    			append_dev(main, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*handleClick, players, $playerId*/ 7) {
    				each_value = /*players*/ ctx[0];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, main, destroy_block, create_each_block$1, null, get_each_context$1);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
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
    	let players;
    	let $stillInGamePlayers;
    	let $playerId;
    	validate_store(stillInGamePlayers, "stillInGamePlayers");
    	component_subscribe($$self, stillInGamePlayers, $$value => $$invalidate(3, $stillInGamePlayers = $$value));
    	validate_store(playerId, "playerId");
    	component_subscribe($$self, playerId, $$value => $$invalidate(1, $playerId = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("VotePicker", slots, []);

    	function handleClick(selected) {
    		sendMessage(getVoteAgainstPayload(selected));
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<VotePicker> was created with unknown prop '${key}'`);
    	});

    	const click_handler = player => handleClick(player);

    	$$self.$capture_state = () => ({
    		stillInGamePlayers,
    		playerId,
    		sendMessage,
    		getVoteAgainstPayload,
    		handleClick,
    		players,
    		$stillInGamePlayers,
    		$playerId
    	});

    	$$self.$inject_state = $$props => {
    		if ("players" in $$props) $$invalidate(0, players = $$props.players);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$stillInGamePlayers*/ 8) {
    			$$invalidate(0, players = $stillInGamePlayers);
    		}
    	};

    	return [players, $playerId, handleClick, $stillInGamePlayers, click_handler];
    }

    class VotePicker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "VotePicker",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/HasVoted.svelte generated by Svelte v3.32.1 */
    const file$5 = "src/HasVoted.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	child_ctx[4] = i;
    	return child_ctx;
    }

    // (11:2) {#each $playersWhoVoted as player, _ (player)}
    function create_each_block$2(key_1, ctx) {
    	let div;
    	let t0_value = `${/*player*/ ctx[2]} ` + "";
    	let t0;
    	let t1;
    	let div_intro;
    	let div_outro;
    	let rect;
    	let stop_animation = noop;
    	let current;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "item svelte-14m52ez");
    			add_location(div, file$5, 11, 4, 334);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*$playersWhoVoted*/ 1) && t0_value !== (t0_value = `${/*player*/ ctx[2]} ` + "")) set_data_dev(t0, t0_value);
    		},
    		r: function measure() {
    			rect = div.getBoundingClientRect();
    		},
    		f: function fix() {
    			fix_position(div);
    			stop_animation();
    			add_transform(div, rect);
    		},
    		a: function animate() {
    			stop_animation();
    			stop_animation = create_animation(div, rect, flip, {});
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, receive, { key: /*player*/ ctx[2] });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, send, { key: /*player*/ ctx[2] });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(11:2) {#each $playersWhoVoted as player, _ (player)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let main;
    	let h2;
    	let t0;
    	let t1;
    	let br;
    	let t2;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value = /*$playersWhoVoted*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*player*/ ctx[2];
    	validate_each_keys(ctx, each_value, get_each_context$2, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$2(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$2(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			h2 = element("h2");
    			t0 = text(/*text*/ ctx[1]);
    			t1 = space();
    			br = element("br");
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h2, "class", "svelte-14m52ez");
    			add_location(h2, file$5, 8, 2, 256);
    			add_location(br, file$5, 9, 2, 274);
    			attr_dev(main, "class", "svelte-14m52ez");
    			add_location(main, file$5, 7, 0, 247);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h2);
    			append_dev(h2, t0);
    			append_dev(main, t1);
    			append_dev(main, br);
    			append_dev(main, t2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*text*/ 2) set_data_dev(t0, /*text*/ ctx[1]);

    			if (dirty & /*$playersWhoVoted*/ 1) {
    				each_value = /*$playersWhoVoted*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
    				validate_each_keys(ctx, each_value, get_each_context$2, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, main, fix_and_outro_and_destroy_block, create_each_block$2, null, get_each_context$2);
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].a();
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
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
    	let text;
    	let $playersWhoVoted;
    	validate_store(playersWhoVoted, "playersWhoVoted");
    	component_subscribe($$self, playersWhoVoted, $$value => $$invalidate(0, $playersWhoVoted = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("HasVoted", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<HasVoted> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		playersWhoVoted,
    		flip,
    		send,
    		receive,
    		text,
    		$playersWhoVoted
    	});

    	$$self.$inject_state = $$props => {
    		if ("text" in $$props) $$invalidate(1, text = $$props.text);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$playersWhoVoted*/ 1) {
    			$$invalidate(1, text = $playersWhoVoted.length > 0
    			? "Has voted: "
    			: "Nobody has voted yet 🤷‍♂️");
    		}
    	};

    	return [$playersWhoVoted, text];
    }

    class HasVoted extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HasVoted",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/WaitingForVote.svelte generated by Svelte v3.32.1 */

    const file$6 = "src/WaitingForVote.svelte";

    function create_fragment$6(ctx) {
    	let h2;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Waiting for vote completion..";
    			attr_dev(h2, "class", "svelte-1kjq7yr");
    			add_location(h2, file$6, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("WaitingForVote", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<WaitingForVote> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class WaitingForVote extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WaitingForVote",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/EndGameText.svelte generated by Svelte v3.32.1 */
    const file$7 = "src/EndGameText.svelte";

    function create_fragment$7(ctx) {
    	let main;
    	let div;
    	let t_value = /*getEndGameText*/ ctx[1](/*gameState*/ ctx[0]) + "";
    	let t;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "end svelte-8u94d1");
    			add_location(div, file$7, 13, 2, 329);
    			add_location(main, file$7, 12, 0, 320);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(div, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*gameState*/ 1 && t_value !== (t_value = /*getEndGameText*/ ctx[1](/*gameState*/ ctx[0]) + "")) set_data_dev(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let gameState;
    	let $voteResult;
    	validate_store(voteResult, "voteResult");
    	component_subscribe($$self, voteResult, $$value => $$invalidate(2, $voteResult = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("EndGameText", slots, []);

    	function getEndGameText(state) {
    		const suffix = `won the game!`;

    		if (state === Status.WON) {
    			return `Cilivians ${suffix}`;
    		}

    		return `Vilains ${suffix}`;
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<EndGameText> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Status,
    		voteResult,
    		getEndGameText,
    		gameState,
    		$voteResult
    	});

    	$$self.$inject_state = $$props => {
    		if ("gameState" in $$props) $$invalidate(0, gameState = $$props.gameState);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$voteResult*/ 4) {
    			$$invalidate(0, gameState = $voteResult.gameState);
    		}
    	};

    	return [gameState, getEndGameText, $voteResult];
    }

    class EndGameText extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EndGameText",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/MrWhiteGuess.svelte generated by Svelte v3.32.1 */
    const file$8 = "src/MrWhiteGuess.svelte";

    function create_fragment$8(ctx) {
    	let main;
    	let h3;
    	let t1;
    	let input;
    	let t2;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h3 = element("h3");
    			h3.textContent = "Try to guess the word to win!";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			button = element("button");
    			button.textContent = "Guess";
    			attr_dev(h3, "class", "svelte-rkg4x0");
    			add_location(h3, file$8, 21, 2, 448);
    			attr_dev(input, "type", "text");
    			add_location(input, file$8, 23, 2, 548);
    			add_location(button, file$8, 29, 2, 659);
    			add_location(main, file$8, 20, 0, 439);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h3);
    			append_dev(main, t1);
    			append_dev(main, input);
    			set_input_value(input, /*message*/ ctx[0]);
    			append_dev(main, t2);
    			append_dev(main, button);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(focus.call(null, input)),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[3]),
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function focus(el) {
    	el.focus();
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("MrWhiteGuess", slots, []);
    	let message = "";

    	function handleClick() {
    		const trimmedWord = message.trim();

    		if (trimmedWord.length > 0) {
    			sendMessage(guessWordPayload(trimmedWord));
    		}
    	}

    	function handleKeyup() {
    		// @ts-ignore
    		if (event.code === "Enter") {
    			handleClick();
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MrWhiteGuess> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		message = this.value;
    		$$invalidate(0, message);
    	}

    	$$self.$capture_state = () => ({
    		sendMessage,
    		guessWordPayload,
    		message,
    		handleClick,
    		focus,
    		handleKeyup
    	});

    	$$self.$inject_state = $$props => {
    		if ("message" in $$props) $$invalidate(0, message = $$props.message);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [message, handleClick, handleKeyup, input_input_handler];
    }

    class MrWhiteGuess extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MrWhiteGuess",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/VoteResult.svelte generated by Svelte v3.32.1 */
    const file$9 = "src/VoteResult.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    // (52:2) {#each detail as pair}
    function create_each_block$3(ctx) {
    	let p;
    	let t_value = `${/*pair*/ ctx[14][0]}: ${/*pair*/ ctx[14][1]}` + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "svelte-du5qfl");
    			add_location(p, file$9, 52, 4, 1688);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*detail*/ 2 && t_value !== (t_value = `${/*pair*/ ctx[14][0]}: ${/*pair*/ ctx[14][1]}` + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(52:2) {#each detail as pair}",
    		ctx
    	});

    	return block;
    }

    // (60:35) 
    function create_if_block_1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_2, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*playerOut*/ ctx[3] !== /*$playerId*/ ctx[6]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(60:35) ",
    		ctx
    	});

    	return block;
    }

    // (58:2) {#if finishedState(gameState)}
    function create_if_block$2(ctx) {
    	let endgametext;
    	let current;
    	endgametext = new EndGameText({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(endgametext.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(endgametext, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(endgametext.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(endgametext.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(endgametext, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(58:2) {#if finishedState(gameState)}",
    		ctx
    	});

    	return block;
    }

    // (63:4) {:else}
    function create_else_block$1(ctx) {
    	let mrwhiteguess;
    	let current;
    	mrwhiteguess = new MrWhiteGuess({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(mrwhiteguess.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(mrwhiteguess, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(mrwhiteguess.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(mrwhiteguess.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(mrwhiteguess, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(63:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (61:4) {#if playerOut !== $playerId}
    function create_if_block_2(ctx) {
    	let h3;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Waiting for Mr white's guess...";
    			attr_dev(h3, "class", "svelte-du5qfl");
    			add_location(h3, file$9, 61, 6, 1897);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(61:4) {#if playerOut !== $playerId}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let main;
    	let h2;
    	let t1;
    	let t2;
    	let br0;
    	let t3;
    	let br1;
    	let t4;
    	let h3;
    	let t5;
    	let t6;
    	let show_if;
    	let current_block_type_index;
    	let if_block;
    	let t7;
    	let br2;
    	let t8;
    	let button;
    	let t9;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*detail*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const if_block_creators = [create_if_block$2, create_if_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (dirty & /*gameState*/ 1) show_if = !!/*finishedState*/ ctx[8](/*gameState*/ ctx[0]);
    		if (show_if) return 0;
    		if (/*waitingForMrWhiteGuess*/ ctx[5]) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx, -1))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			h2 = element("h2");
    			h2.textContent = "Vote result";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			br0 = element("br");
    			t3 = space();
    			br1 = element("br");
    			t4 = space();
    			h3 = element("h3");
    			t5 = text(/*text*/ ctx[2]);
    			t6 = space();
    			if (if_block) if_block.c();
    			t7 = space();
    			br2 = element("br");
    			t8 = space();
    			button = element("button");
    			t9 = text(/*btnText*/ ctx[4]);
    			attr_dev(h2, "class", "svelte-du5qfl");
    			add_location(h2, file$9, 49, 2, 1637);
    			add_location(br0, file$9, 54, 2, 1734);
    			add_location(br1, file$9, 55, 2, 1743);
    			attr_dev(h3, "class", "svelte-du5qfl");
    			add_location(h3, file$9, 56, 2, 1752);
    			add_location(br2, file$9, 66, 2, 1993);
    			button.disabled = /*waitingForMrWhiteGuess*/ ctx[5];
    			add_location(button, file$9, 67, 2, 2002);
    			add_location(main, file$9, 48, 0, 1628);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h2);
    			append_dev(main, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}

    			append_dev(main, t2);
    			append_dev(main, br0);
    			append_dev(main, t3);
    			append_dev(main, br1);
    			append_dev(main, t4);
    			append_dev(main, h3);
    			append_dev(h3, t5);
    			append_dev(main, t6);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(main, null);
    			}

    			append_dev(main, t7);
    			append_dev(main, br2);
    			append_dev(main, t8);
    			append_dev(main, button);
    			append_dev(button, t9);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[11], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*detail*/ 2) {
    				each_value = /*detail*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(main, t2);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (!current || dirty & /*text*/ 4) set_data_dev(t5, /*text*/ ctx[2]);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx, dirty);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(main, t7);
    				} else {
    					if_block = null;
    				}
    			}

    			if (!current || dirty & /*btnText*/ 16) set_data_dev(t9, /*btnText*/ ctx[4]);

    			if (!current || dirty & /*waitingForMrWhiteGuess*/ 32) {
    				prop_dev(button, "disabled", /*waitingForMrWhiteGuess*/ ctx[5]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let isDraw;
    	let detail;
    	let text;
    	let gameState;
    	let playerOut;
    	let btnText;
    	let waitingForMrWhiteGuess;
    	let $voteResult;
    	let $votedOutPlayers;
    	let $playerId;
    	validate_store(voteResult, "voteResult");
    	component_subscribe($$self, voteResult, $$value => $$invalidate(10, $voteResult = $$value));
    	validate_store(votedOutPlayers, "votedOutPlayers");
    	component_subscribe($$self, votedOutPlayers, $$value => $$invalidate(12, $votedOutPlayers = $$value));
    	validate_store(playerId, "playerId");
    	component_subscribe($$self, playerId, $$value => $$invalidate(6, $playerId = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("VoteResult", slots, []);

    	function handleClick(gameState) {
    		if (isDraw) {
    			playingState.set("voting");
    		} else if (finishedState(gameState)) {
    			sendMessage({ topic: "game", subtopic: "start" });
    			playingState.set("started");
    		} else {
    			// sync with server on player turn
    			sendMessage(getGameInfoPayload());

    			votedOutPlayers.set([...$votedOutPlayers, $voteResult.playerOut]);
    			playingState.set("started");
    		}
    	}

    	function getBtnText(state, voteResult) {
    		if (finishedState(state)) {
    			return "Play again";
    		}

    		return voteResult === "DRAW" ? "Vote again!" : "Next turn";
    	}

    	const finishedState = state => state === Status.WON || state === Status.LOST;

    	onMount(() => {
    		playersWhoVoted.set([]);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<VoteResult> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => handleClick(gameState);

    	$$self.$capture_state = () => ({
    		onMount,
    		EndGameText,
    		MrWhiteGuess,
    		playerId,
    		playersWhoVoted,
    		playingState,
    		sendMessage,
    		votedOutPlayers,
    		voteResult,
    		getGameInfoPayload,
    		Status,
    		handleClick,
    		getBtnText,
    		finishedState,
    		isDraw,
    		$voteResult,
    		detail,
    		text,
    		gameState,
    		playerOut,
    		btnText,
    		waitingForMrWhiteGuess,
    		$votedOutPlayers,
    		$playerId
    	});

    	$$self.$inject_state = $$props => {
    		if ("isDraw" in $$props) $$invalidate(9, isDraw = $$props.isDraw);
    		if ("detail" in $$props) $$invalidate(1, detail = $$props.detail);
    		if ("text" in $$props) $$invalidate(2, text = $$props.text);
    		if ("gameState" in $$props) $$invalidate(0, gameState = $$props.gameState);
    		if ("playerOut" in $$props) $$invalidate(3, playerOut = $$props.playerOut);
    		if ("btnText" in $$props) $$invalidate(4, btnText = $$props.btnText);
    		if ("waitingForMrWhiteGuess" in $$props) $$invalidate(5, waitingForMrWhiteGuess = $$props.waitingForMrWhiteGuess);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$voteResult*/ 1024) {
    			$$invalidate(9, isDraw = $voteResult.result === "DRAW");
    		}

    		if ($$self.$$.dirty & /*$voteResult*/ 1024) {
    			$$invalidate(1, detail = $voteResult.voteDetails);
    		}

    		if ($$self.$$.dirty & /*isDraw, $voteResult*/ 1536) {
    			$$invalidate(2, text = isDraw
    			? "It is a draw! 🙃"
    			: `${$voteResult.playerOut} (${$voteResult.playerOutRole}) has been eliminated! ☠️`);
    		}

    		if ($$self.$$.dirty & /*$voteResult*/ 1024) {
    			$$invalidate(0, gameState = $voteResult.gameState);
    		}

    		if ($$self.$$.dirty & /*$voteResult*/ 1024) {
    			$$invalidate(3, playerOut = $voteResult.playerOut);
    		}

    		if ($$self.$$.dirty & /*gameState, $voteResult*/ 1025) {
    			$$invalidate(4, btnText = getBtnText(gameState, $voteResult.result));
    		}

    		if ($$self.$$.dirty & /*gameState*/ 1) {
    			$$invalidate(5, waitingForMrWhiteGuess = gameState === Status.MR_WHITE_GUESS_WAITING);
    		}

    		if ($$self.$$.dirty & /*gameState*/ 1) {
    			if (finishedState(gameState)) {
    				votedOutPlayers.set([]);
    			}
    		}
    	};

    	return [
    		gameState,
    		detail,
    		text,
    		playerOut,
    		btnText,
    		waitingForMrWhiteGuess,
    		$playerId,
    		handleClick,
    		finishedState,
    		isDraw,
    		$voteResult,
    		click_handler
    	];
    }

    class VoteResult extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "VoteResult",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/VoteScreen.svelte generated by Svelte v3.32.1 */

    const { console: console_1 } = globals;
    const file$a = "src/VoteScreen.svelte";

    // (40:32) 
    function create_if_block_3(ctx) {
    	let div;
    	let voteresult;
    	let div_intro;
    	let div_outro;
    	let current;
    	let mounted;
    	let dispose;
    	voteresult = new VoteResult({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(voteresult.$$.fragment);
    			add_location(div, file$a, 40, 4, 1263);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(voteresult, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "outroend", /*onOutro*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(voteresult.$$.fragment, local);

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, fade, {});
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(voteresult.$$.fragment, local);
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(voteresult);
    			if (detaching && div_outro) div_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(40:32) ",
    		ctx
    	});

    	return block;
    }

    // (35:31) 
    function create_if_block_2$1(ctx) {
    	let div;
    	let waitingforvote;
    	let t;
    	let hasvoted;
    	let div_intro;
    	let div_outro;
    	let current;
    	let mounted;
    	let dispose;
    	waitingforvote = new WaitingForVote({ $$inline: true });
    	hasvoted = new HasVoted({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(waitingforvote.$$.fragment);
    			t = space();
    			create_component(hasvoted.$$.fragment);
    			add_location(div, file$a, 35, 4, 1126);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(waitingforvote, div, null);
    			append_dev(div, t);
    			mount_component(hasvoted, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "outroend", /*onOutro*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(waitingforvote.$$.fragment, local);
    			transition_in(hasvoted.$$.fragment, local);

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, fade, {});
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(waitingforvote.$$.fragment, local);
    			transition_out(hasvoted.$$.fragment, local);
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(waitingforvote);
    			destroy_component(hasvoted);
    			if (detaching && div_outro) div_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(35:31) ",
    		ctx
    	});

    	return block;
    }

    // (27:2) {#if $state === "init"}
    function create_if_block$3(ctx) {
    	let div;
    	let t0;
    	let hasvoted;
    	let t1;
    	let playersgrid;
    	let div_intro;
    	let div_outro;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = !/*$playerLost*/ ctx[1] && create_if_block_1$1(ctx);
    	hasvoted = new HasVoted({ $$inline: true });
    	playersgrid = new PlayersGrid({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			create_component(hasvoted.$$.fragment);
    			t1 = space();
    			create_component(playersgrid.$$.fragment);
    			add_location(div, file$a, 27, 4, 933);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t0);
    			mount_component(hasvoted, div, null);
    			append_dev(div, t1);
    			mount_component(playersgrid, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "outroend", /*onOutro*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!/*$playerLost*/ ctx[1]) {
    				if (if_block) {
    					if (dirty & /*$playerLost*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, t0);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(hasvoted.$$.fragment, local);
    			transition_in(playersgrid.$$.fragment, local);

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, fade, {});
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(hasvoted.$$.fragment, local);
    			transition_out(playersgrid.$$.fragment, local);
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			destroy_component(hasvoted);
    			destroy_component(playersgrid);
    			if (detaching && div_outro) div_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(27:2) {#if $state === \\\"init\\\"}",
    		ctx
    	});

    	return block;
    }

    // (29:6) {#if !$playerLost}
    function create_if_block_1$1(ctx) {
    	let votepicker;
    	let current;
    	votepicker = new VotePicker({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(votepicker.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(votepicker, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(votepicker.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(votepicker.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(votepicker, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(29:6) {#if !$playerLost}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let main;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$3, create_if_block_2$1, create_if_block_3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$state*/ ctx[0] === "init") return 0;
    		if (/*$state*/ ctx[0] === "voted") return 1;
    		if (/*$state*/ ctx[0] === "result") return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block) if_block.c();
    			add_location(main, file$a, 25, 0, 896);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(main, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(main, null);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let $playingState;
    	let $hasVoted;
    	let $playersWhoVoted;
    	let $state;
    	let $playerLost;
    	validate_store(playingState, "playingState");
    	component_subscribe($$self, playingState, $$value => $$invalidate(4, $playingState = $$value));
    	validate_store(hasVoted, "hasVoted");
    	component_subscribe($$self, hasVoted, $$value => $$invalidate(5, $hasVoted = $$value));
    	validate_store(playersWhoVoted, "playersWhoVoted");
    	component_subscribe($$self, playersWhoVoted, $$value => $$invalidate(6, $playersWhoVoted = $$value));
    	validate_store(playerLost, "playerLost");
    	component_subscribe($$self, playerLost, $$value => $$invalidate(1, $playerLost = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("VoteScreen", slots, []);
    	const { onOutro, transitionTo, state } = statefulSwap("init");
    	validate_store(state, "state");
    	component_subscribe($$self, state, value => $$invalidate(0, $state = value));
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<VoteScreen> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		VotePicker,
    		statefulSwap,
    		HasVoted,
    		PlayersGrid,
    		hasVoted,
    		playersWhoVoted,
    		playerLost,
    		playingState,
    		fade,
    		WaitingForVote,
    		VoteResult,
    		onOutro,
    		transitionTo,
    		state,
    		$playingState,
    		$hasVoted,
    		$playersWhoVoted,
    		$state,
    		$playerLost
    	});

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$playingState, $hasVoted, $playersWhoVoted*/ 112) {
    			if ($playingState === "voting" && !$hasVoted) {
    				console.log("Vote init!!");
    				transitionTo("init");
    			} else if ($playingState === "result") {
    				console.log("Showing result!!");
    				transitionTo("result");
    			} else {
    				console.log(`$hasVoted: ${$hasVoted}, playingState: ${$playingState}.
    $playersWhoVoted: ${$playersWhoVoted}`);

    				console.log("has voted!!");
    				transitionTo("voted");
    			}
    		}
    	};

    	return [
    		$state,
    		$playerLost,
    		onOutro,
    		state,
    		$playingState,
    		$hasVoted,
    		$playersWhoVoted
    	];
    }

    class VoteScreen extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "VoteScreen",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/WaitForGameCompletion.svelte generated by Svelte v3.32.1 */

    const file$b = "src/WaitForGameCompletion.svelte";

    function create_fragment$b(ctx) {
    	let h2;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Waiting for game to complete..";
    			attr_dev(h2, "class", "svelte-1kjq7yr");
    			add_location(h2, file$b, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("WaitForGameCompletion", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<WaitForGameCompletion> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class WaitForGameCompletion extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WaitForGameCompletion",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/SkipWord.svelte generated by Svelte v3.32.1 */
    const file$c = "src/SkipWord.svelte";

    function create_fragment$c(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Skip word";
    			add_location(button, file$c, 9, 0, 171);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*handleClick*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SkipWord", slots, []);

    	function handleClick() {
    		sendMessage({ topic: "game", subtopic: "start" });
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SkipWord> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ sendMessage, handleClick });
    	return [handleClick];
    }

    class SkipWord extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SkipWord",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src/GameBoard.svelte generated by Svelte v3.32.1 */

    const { console: console_1$1 } = globals;
    const file$d = "src/GameBoard.svelte";

    // (55:32) 
    function create_if_block_3$1(ctx) {
    	let div;
    	let votescreen;
    	let div_intro;
    	let div_outro;
    	let current;
    	let mounted;
    	let dispose;
    	votescreen = new VoteScreen({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(votescreen.$$.fragment);
    			add_location(div, file$d, 55, 4, 1573);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(votescreen, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "outroend", /*onOutro*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(votescreen.$$.fragment, local);

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, fly, { x: 500, duration: 500 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(votescreen.$$.fragment, local);
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fly, { y: 500, duration: 500 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(votescreen);
    			if (detaching && div_outro) div_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(55:32) ",
    		ctx
    	});

    	return block;
    }

    // (41:33) 
    function create_if_block_1$2(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let t0;
    	let br;
    	let t1;
    	let playersgrid;
    	let div_intro;
    	let div_outro;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block_2$2, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*$playerLost*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	playersgrid = new PlayersGrid({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			t0 = space();
    			br = element("br");
    			t1 = space();
    			create_component(playersgrid.$$.fragment);
    			add_location(br, file$d, 51, 6, 1496);
    			add_location(div, file$d, 41, 4, 1231);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			append_dev(div, t0);
    			append_dev(div, br);
    			append_dev(div, t1);
    			mount_component(playersgrid, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "outroend", /*onOutro*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, t0);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(playersgrid.$$.fragment, local);

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, fade, {});
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(playersgrid.$$.fragment, local);
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fly, { x: -500, duration: 500 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    			destroy_component(playersgrid);
    			if (detaching && div_outro) div_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(41:33) ",
    		ctx
    	});

    	return block;
    }

    // (33:2) {#if $state === "first"}
    function create_if_block$4(ctx) {
    	let div;
    	let word;
    	let t0;
    	let playerturn;
    	let t1;
    	let wordinput;
    	let t2;
    	let br;
    	let t3;
    	let skipword;
    	let div_intro;
    	let div_outro;
    	let current;
    	let mounted;
    	let dispose;
    	word = new Word({ $$inline: true });
    	playerturn = new PlayerTurn({ $$inline: true });
    	wordinput = new WordInput({ $$inline: true });
    	skipword = new SkipWord({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(word.$$.fragment);
    			t0 = space();
    			create_component(playerturn.$$.fragment);
    			t1 = space();
    			create_component(wordinput.$$.fragment);
    			t2 = space();
    			br = element("br");
    			t3 = space();
    			create_component(skipword.$$.fragment);
    			add_location(br, file$d, 37, 6, 1156);
    			add_location(div, file$d, 33, 4, 1022);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(word, div, null);
    			append_dev(div, t0);
    			mount_component(playerturn, div, null);
    			append_dev(div, t1);
    			mount_component(wordinput, div, null);
    			append_dev(div, t2);
    			append_dev(div, br);
    			append_dev(div, t3);
    			mount_component(skipword, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "outroend", /*onOutro*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(word.$$.fragment, local);
    			transition_in(playerturn.$$.fragment, local);
    			transition_in(wordinput.$$.fragment, local);
    			transition_in(skipword.$$.fragment, local);

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, fly, { y: 500, duration: 500 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(word.$$.fragment, local);
    			transition_out(playerturn.$$.fragment, local);
    			transition_out(wordinput.$$.fragment, local);
    			transition_out(skipword.$$.fragment, local);
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(word);
    			destroy_component(playerturn);
    			destroy_component(wordinput);
    			destroy_component(skipword);
    			if (detaching && div_outro) div_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(33:2) {#if $state === \\\"first\\\"}",
    		ctx
    	});

    	return block;
    }

    // (47:6) {:else}
    function create_else_block$2(ctx) {
    	let word;
    	let t0;
    	let playerturn;
    	let t1;
    	let wordinput;
    	let current;
    	word = new Word({ $$inline: true });
    	playerturn = new PlayerTurn({ $$inline: true });
    	wordinput = new WordInput({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(word.$$.fragment);
    			t0 = space();
    			create_component(playerturn.$$.fragment);
    			t1 = space();
    			create_component(wordinput.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(word, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(playerturn, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(wordinput, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(word.$$.fragment, local);
    			transition_in(playerturn.$$.fragment, local);
    			transition_in(wordinput.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(word.$$.fragment, local);
    			transition_out(playerturn.$$.fragment, local);
    			transition_out(wordinput.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(word, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(playerturn, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(wordinput, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(47:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (43:6) {#if $playerLost}
    function create_if_block_2$2(ctx) {
    	let waitforgamecompletion;
    	let t0;
    	let word;
    	let t1;
    	let playerturn;
    	let current;
    	waitforgamecompletion = new WaitForGameCompletion({ $$inline: true });
    	word = new Word({ $$inline: true });
    	playerturn = new PlayerTurn({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(waitforgamecompletion.$$.fragment);
    			t0 = space();
    			create_component(word.$$.fragment);
    			t1 = space();
    			create_component(playerturn.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(waitforgamecompletion, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(word, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(playerturn, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(waitforgamecompletion.$$.fragment, local);
    			transition_in(word.$$.fragment, local);
    			transition_in(playerturn.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(waitforgamecompletion.$$.fragment, local);
    			transition_out(word.$$.fragment, local);
    			transition_out(playerturn.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(waitforgamecompletion, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(word, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(playerturn, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(43:6) {#if $playerLost}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let main;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$4, create_if_block_1$2, create_if_block_3$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$state*/ ctx[0] === "first") return 0;
    		if (/*$state*/ ctx[0] === "started") return 1;
    		if (/*$state*/ ctx[0] === "voting") return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block) if_block.c();
    			add_location(main, file$d, 31, 0, 984);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(main, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(main, null);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let $playingState;
    	let $currentTurn;
    	let $state;
    	let $playerLost;
    	validate_store(playingState, "playingState");
    	component_subscribe($$self, playingState, $$value => $$invalidate(4, $playingState = $$value));
    	validate_store(currentTurn, "currentTurn");
    	component_subscribe($$self, currentTurn, $$value => $$invalidate(5, $currentTurn = $$value));
    	validate_store(playerLost, "playerLost");
    	component_subscribe($$self, playerLost, $$value => $$invalidate(1, $playerLost = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("GameBoard", slots, []);
    	const { onOutro, transitionTo, state } = statefulSwap("first");
    	validate_store(state, "state");
    	component_subscribe($$self, state, value => $$invalidate(0, $state = value));
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<GameBoard> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		PlayersGrid,
    		PlayerTurn,
    		Word,
    		WordInput,
    		statefulSwap,
    		fly,
    		fade,
    		currentTurn,
    		playerLost,
    		playingState,
    		VoteScreen,
    		WaitForGameCompletion,
    		SkipWord,
    		onOutro,
    		transitionTo,
    		state,
    		$playingState,
    		$currentTurn,
    		$state,
    		$playerLost
    	});

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$playingState, $currentTurn*/ 48) {
    			if ($playingState === "voting") {
    				console.log("voting");
    				transitionTo($playingState);
    			} else if ($currentTurn === 0) {
    				console.log("first");
    				transitionTo("first");
    			} else if ($playingState === "started") {
    				console.log("started");
    				transitionTo($playingState);
    			} else {
    				console.log(`I'm nowhere...
    $playingState ${$playingState},
    $playingState ${$currentTurn},
    `);
    			}
    		}
    	};

    	return [$state, $playerLost, onOutro, state, $playingState, $currentTurn];
    }

    class GameBoard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GameBoard",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src/NameInput.svelte generated by Svelte v3.32.1 */
    const file$e = "src/NameInput.svelte";

    function create_fragment$e(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let h2;
    	let t3;
    	let br0;
    	let t4;
    	let input;
    	let t5;
    	let br1;
    	let t6;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Undercover";
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = "Input your name";
    			t3 = space();
    			br0 = element("br");
    			t4 = space();
    			input = element("input");
    			t5 = space();
    			br1 = element("br");
    			t6 = space();
    			button = element("button");
    			button.textContent = "OK";
    			attr_dev(h1, "class", "svelte-1a3sshp");
    			add_location(h1, file$e, 39, 2, 737);
    			attr_dev(h2, "class", "svelte-1a3sshp");
    			add_location(h2, file$e, 40, 2, 759);
    			add_location(br0, file$e, 41, 2, 786);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "size", "15");
    			attr_dev(input, "class", "svelte-1a3sshp");
    			add_location(input, file$e, 42, 2, 795);
    			add_location(br1, file$e, 49, 2, 920);
    			attr_dev(button, "class", "svelte-1a3sshp");
    			add_location(button, file$e, 50, 2, 929);
    			add_location(main, file$e, 38, 0, 728);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, h2);
    			append_dev(main, t3);
    			append_dev(main, br0);
    			append_dev(main, t4);
    			append_dev(main, input);
    			set_input_value(input, /*message*/ ctx[0]);
    			append_dev(main, t5);
    			append_dev(main, br1);
    			append_dev(main, t6);
    			append_dev(main, button);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(focus$1.call(null, input)),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[5]),
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
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function focus$1(el) {
    	el.focus();
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let players;
    	let $playerStore;
    	let $connectionOpened;
    	validate_store(playerStore, "playerStore");
    	component_subscribe($$self, playerStore, $$value => $$invalidate(3, $playerStore = $$value));
    	validate_store(connectionOpened, "connectionOpened");
    	component_subscribe($$self, connectionOpened, $$value => $$invalidate(4, $connectionOpened = $$value));
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
    		connectionOpened,
    		getPlayersPayload,
    		wrapAddPlayerPayload,
    		message,
    		handleClick,
    		focus: focus$1,
    		handleKeyup,
    		players,
    		$playerStore,
    		$connectionOpened
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

    		if ($$self.$$.dirty & /*$connectionOpened*/ 16) {
    			if ($connectionOpened) {
    				sendMessage(getPlayersPayload());
    			}
    		}
    	};

    	return [
    		message,
    		handleClick,
    		handleKeyup,
    		$playerStore,
    		$connectionOpened,
    		input_input_handler
    	];
    }

    class NameInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NameInput",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* src/PlayerList.svelte generated by Svelte v3.32.1 */
    const file$f = "src/PlayerList.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	child_ctx[5] = i;
    	return child_ctx;
    }

    // (14:2) {#each players as player, _ (player)}
    function create_each_block$4(key_1, ctx) {
    	let p;
    	let html_tag;
    	let raw_value = formatName(/*$playerId*/ ctx[1], /*player*/ ctx[3]) + "";
    	let t;
    	let p_intro;
    	let p_outro;
    	let rect;
    	let stop_animation = noop;
    	let current;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			p = element("p");
    			t = space();
    			html_tag = new HtmlTag(t);
    			add_location(p, file$f, 14, 4, 419);
    			this.first = p;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			html_tag.m(raw_value, p);
    			append_dev(p, t);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*$playerId, players*/ 3) && raw_value !== (raw_value = formatName(/*$playerId*/ ctx[1], /*player*/ ctx[3]) + "")) html_tag.p(raw_value);
    		},
    		r: function measure() {
    			rect = p.getBoundingClientRect();
    		},
    		f: function fix() {
    			fix_position(p);
    			stop_animation();
    			add_transform(p, rect);
    		},
    		a: function animate() {
    			stop_animation();
    			stop_animation = create_animation(p, rect, flip, {});
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (p_outro) p_outro.end(1);
    				if (!p_intro) p_intro = create_in_transition(p, receive, { key: /*$playerId*/ ctx[1] });
    				p_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (p_intro) p_intro.invalidate();
    			p_outro = create_out_transition(p, send, { key: /*$playerId*/ ctx[1] });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching && p_outro) p_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(14:2) {#each players as player, _ (player)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let main;
    	let h2;
    	let t1;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value = /*players*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*player*/ ctx[3];
    	validate_each_keys(ctx, each_value, get_each_context$4, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$4(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$4(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			h2 = element("h2");
    			h2.textContent = "Connected players";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h2, "class", "svelte-1kjq7yr");
    			add_location(h2, file$f, 12, 2, 348);
    			add_location(main, file$f, 11, 0, 339);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h2);
    			append_dev(main, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$playerId, formatName, players*/ 3) {
    				each_value = /*players*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
    				validate_each_keys(ctx, each_value, get_each_context$4, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, main, fix_and_outro_and_destroy_block, create_each_block$4, null, get_each_context$4);
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].a();
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
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

    function instance$f($$self, $$props, $$invalidate) {
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
    		flip,
    		send,
    		receive,
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
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PlayerList",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    /* src/Settings.svelte generated by Svelte v3.32.1 */
    const file$g = "src/Settings.svelte";

    function create_fragment$g(ctx) {
    	let main;
    	let h2;
    	let t1;
    	let p0;
    	let t3;
    	let button0;
    	let t5;
    	let div0;
    	let t6;
    	let t7;
    	let button1;
    	let t9;
    	let p1;
    	let t11;
    	let button2;
    	let t13;
    	let div1;
    	let t14;
    	let t15;
    	let button3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h2 = element("h2");
    			h2.textContent = "Settings";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Undercover";
    			t3 = space();
    			button0 = element("button");
    			button0.textContent = `${"<"}`;
    			t5 = space();
    			div0 = element("div");
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
    			div1 = element("div");
    			t14 = text(/*$mrWhiteCount*/ ctx[1]);
    			t15 = space();
    			button3 = element("button");
    			button3.textContent = `${">"}`;
    			attr_dev(h2, "class", "svelte-1678sro");
    			add_location(h2, file$g, 16, 2, 388);
    			add_location(p0, file$g, 17, 2, 408);
    			attr_dev(button0, "class", "svelte-1678sro");
    			add_location(button0, file$g, 18, 2, 428);
    			attr_dev(div0, "class", "svelte-1678sro");
    			add_location(div0, file$g, 21, 2, 517);
    			attr_dev(button1, "class", "svelte-1678sro");
    			add_location(button1, file$g, 22, 2, 549);
    			add_location(p1, file$g, 25, 2, 638);
    			attr_dev(button2, "class", "svelte-1678sro");
    			add_location(button2, file$g, 26, 2, 656);
    			attr_dev(div1, "class", "svelte-1678sro");
    			add_location(div1, file$g, 27, 2, 734);
    			attr_dev(button3, "class", "svelte-1678sro");
    			add_location(button3, file$g, 28, 2, 763);
    			attr_dev(main, "class", "svelte-1678sro");
    			add_location(main, file$g, 15, 0, 379);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h2);
    			append_dev(main, t1);
    			append_dev(main, p0);
    			append_dev(main, t3);
    			append_dev(main, button0);
    			append_dev(main, t5);
    			append_dev(main, div0);
    			append_dev(div0, t6);
    			append_dev(main, t7);
    			append_dev(main, button1);
    			append_dev(main, t9);
    			append_dev(main, p1);
    			append_dev(main, t11);
    			append_dev(main, button2);
    			append_dev(main, t13);
    			append_dev(main, div1);
    			append_dev(div1, t14);
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
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }

    /* src/StartButton.svelte generated by Svelte v3.32.1 */
    const file$h = "src/StartButton.svelte";

    function create_fragment$h(ctx) {
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text("Start");
    			button.disabled = /*disabledButton*/ ctx[0];
    			add_location(button, file$h, 22, 0, 734);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*startGame*/ ctx[1], false, false, false);
    				mounted = true;
    			}
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
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
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

    function instance$h($$self, $$props, $$invalidate) {
    	let playerNumbers;
    	let disabledButton;
    	let $playerStore;
    	let $undercoverCount;
    	let $mrWhiteCount;
    	validate_store(playerStore, "playerStore");
    	component_subscribe($$self, playerStore, $$value => $$invalidate(3, $playerStore = $$value));
    	validate_store(undercoverCount, "undercoverCount");
    	component_subscribe($$self, undercoverCount, $$value => $$invalidate(4, $undercoverCount = $$value));
    	validate_store(mrWhiteCount, "mrWhiteCount");
    	component_subscribe($$self, mrWhiteCount, $$value => $$invalidate(5, $mrWhiteCount = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("StartButton", slots, []);

    	function startGame() {
    		sendMessage({ topic: "game", subtopic: "start" });
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<StartButton> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		undercoverCount,
    		mrWhiteCount,
    		playerStore,
    		sendMessage,
    		canStartGame,
    		startGame,
    		playerNumbers,
    		$playerStore,
    		disabledButton,
    		$undercoverCount,
    		$mrWhiteCount
    	});

    	$$self.$inject_state = $$props => {
    		if ("playerNumbers" in $$props) $$invalidate(2, playerNumbers = $$props.playerNumbers);
    		if ("disabledButton" in $$props) $$invalidate(0, disabledButton = $$props.disabledButton);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$playerStore*/ 8) {
    			$$invalidate(2, playerNumbers = $playerStore.length);
    		}

    		if ($$self.$$.dirty & /*$undercoverCount, $mrWhiteCount, playerNumbers*/ 52) {
    			$$invalidate(0, disabledButton = !canStartGame($undercoverCount, $mrWhiteCount, playerNumbers));
    		}
    	};

    	return [
    		disabledButton,
    		startGame,
    		playerNumbers,
    		$playerStore,
    		$undercoverCount,
    		$mrWhiteCount
    	];
    }

    class StartButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StartButton",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    /* src/Lobby.svelte generated by Svelte v3.32.1 */
    const file$i = "src/Lobby.svelte";

    // (19:2) {:else}
    function create_else_block$3(ctx) {
    	let div;
    	let settings;
    	let t0;
    	let br0;
    	let t1;
    	let startbutton;
    	let t2;
    	let br1;
    	let t3;
    	let playerlist;
    	let div_intro;
    	let current;
    	let mounted;
    	let dispose;
    	settings = new Settings({ $$inline: true });
    	startbutton = new StartButton({ $$inline: true });
    	playerlist = new PlayerList({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(settings.$$.fragment);
    			t0 = space();
    			br0 = element("br");
    			t1 = space();
    			create_component(startbutton.$$.fragment);
    			t2 = space();
    			br1 = element("br");
    			t3 = space();
    			create_component(playerlist.$$.fragment);
    			add_location(br0, file$i, 21, 6, 681);
    			add_location(br1, file$i, 23, 6, 716);
    			add_location(div, file$i, 19, 4, 592);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(settings, div, null);
    			append_dev(div, t0);
    			append_dev(div, br0);
    			append_dev(div, t1);
    			mount_component(startbutton, div, null);
    			append_dev(div, t2);
    			append_dev(div, br1);
    			append_dev(div, t3);
    			mount_component(playerlist, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "outroend", /*onOutro*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(settings.$$.fragment, local);
    			transition_in(startbutton.$$.fragment, local);
    			transition_in(playerlist.$$.fragment, local);

    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, fly, { x: 500, duration: 1000 });
    					div_intro.start();
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(settings.$$.fragment, local);
    			transition_out(startbutton.$$.fragment, local);
    			transition_out(playerlist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(settings);
    			destroy_component(startbutton);
    			destroy_component(playerlist);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(19:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (15:2) {#if $state === ""}
    function create_if_block$5(ctx) {
    	let div;
    	let nameinput;
    	let div_outro;
    	let current;
    	let mounted;
    	let dispose;
    	nameinput = new NameInput({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(nameinput.$$.fragment);
    			add_location(div, file$i, 15, 4, 482);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(nameinput, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "outroend", /*onOutro*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(nameinput.$$.fragment, local);
    			if (div_outro) div_outro.end(1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(nameinput.$$.fragment, local);
    			div_outro = create_out_transition(div, fly, { x: -100, duration: 100 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(nameinput);
    			if (detaching && div_outro) div_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(15:2) {#if $state === \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
    	let main;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$5, create_else_block$3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$state*/ ctx[0] === "") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if_block.c();
    			add_location(main, file$i, 13, 0, 449);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if_blocks[current_block_type_index].m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(main, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let $playerId;
    	let $state;
    	validate_store(playerId, "playerId");
    	component_subscribe($$self, playerId, $$value => $$invalidate(3, $playerId = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Lobby", slots, []);
    	const { onOutro, transitionTo, state } = statefulSwap($playerId);
    	validate_store(state, "state");
    	component_subscribe($$self, state, value => $$invalidate(0, $state = value));
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Lobby> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		fly,
    		NameInput,
    		PlayerList,
    		Settings,
    		StartButton,
    		playerId,
    		statefulSwap,
    		onOutro,
    		transitionTo,
    		state,
    		$playerId,
    		$state
    	});

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$playerId*/ 8) {
    			if ($playerId) {
    				transitionTo($playerId);
    			}
    		}
    	};

    	return [$state, onOutro, state, $playerId];
    }

    class Lobby extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Lobby",
    			options,
    			id: create_fragment$i.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.32.1 */
    const file$j = "src/App.svelte";

    // (13:2) {#if $state === "init"}
    function create_if_block_1$3(ctx) {
    	let div;
    	let lobby;
    	let div_outro;
    	let current;
    	let mounted;
    	let dispose;
    	lobby = new Lobby({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(lobby.$$.fragment);
    			add_location(div, file$j, 13, 4, 402);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(lobby, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "outroend", /*onOutro*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(lobby.$$.fragment, local);
    			if (div_outro) div_outro.end(1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(lobby.$$.fragment, local);
    			div_outro = create_out_transition(div, fly, { y: -150 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(lobby);
    			if (detaching && div_outro) div_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(13:2) {#if $state === \\\"init\\\"}",
    		ctx
    	});

    	return block;
    }

    // (18:2) {#if $state === "started"}
    function create_if_block$6(ctx) {
    	let div;
    	let gameboard;
    	let div_intro;
    	let current;
    	let mounted;
    	let dispose;
    	gameboard = new GameBoard({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(gameboard.$$.fragment);
    			add_location(div, file$j, 18, 4, 520);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(gameboard, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "outroend", /*onOutro*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gameboard.$$.fragment, local);

    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, fly, { y: 150 });
    					div_intro.start();
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gameboard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(gameboard);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(18:2) {#if $state === \\\"started\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
    	let main;
    	let t;
    	let current;
    	let if_block0 = /*$state*/ ctx[0] === "init" && create_if_block_1$3(ctx);
    	let if_block1 = /*$state*/ ctx[0] === "started" && create_if_block$6(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(main, "class", "svelte-1gmv5eg");
    			add_location(main, file$j, 11, 0, 365);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t);
    			if (if_block1) if_block1.m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$state*/ ctx[0] === "init") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*$state*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1$3(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(main, t);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*$state*/ ctx[0] === "started") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*$state*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$6(ctx);
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
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let $playingState;
    	let $state;
    	validate_store(playingState, "playingState");
    	component_subscribe($$self, playingState, $$value => $$invalidate(3, $playingState = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const { onOutro, transitionTo, state } = statefulSwap("init");
    	validate_store(state, "state");
    	component_subscribe($$self, state, value => $$invalidate(0, $state = value));
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		fly,
    		GameBoard,
    		Lobby,
    		statefulSwap,
    		playingState,
    		onOutro,
    		transitionTo,
    		state,
    		$playingState,
    		$state
    	});

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$playingState*/ 8) {
    			if ($playingState === "started") {
    				transitionTo("started");
    			}
    		}
    	};

    	return [$state, onOutro, state, $playingState];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$j.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
