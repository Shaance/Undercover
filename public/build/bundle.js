
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
    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
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
    const connectionOpened = writable(false);
    const ownWord = writable('init');
    const playingState = writable('init');
    const playerToWords = writable([]);
    const currentPlayerTurn = writable('');
    const hasVoted = writable(false);
    const playersWhoVoted = writable([]);
    // @ts-ignore
    console.log('{"env":{"API_URL":"wss://b455891f6f6b.ngrok.io"}} + ' + {"env":{"API_URL":"wss://b455891f6f6b.ngrok.io"}}.env.API_URL);
    // @ts-ignore
    console.log('\nprocess.env.OTHER ' + {"env":{"API_URL":"wss://b455891f6f6b.ngrok.io"}}.env.OTHER);
    // @ts-ignore
    const socket = new WebSocket({"env":{"API_URL":"wss://b455891f6f6b.ngrok.io"}}.env.API_URL);
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
                currentPlayerTurn.set(data.player);
                if (data.turn !== 0 && data.turn % get_store_value(playerStore).length === 0) {
                    playingState.set('voting');
                }
            }
        }
        else if (resp.topic === 'vote') {
            if (resp.subtopic === 'update') {
                const response = resp;
                playersWhoVoted.set(response.data.playersWhoVoted);
            }
        }
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

    function flip(node, animation, params) {
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

    /* src/PlayersGrid.svelte generated by Svelte v3.31.2 */
    const file = "src/PlayersGrid.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (36:6) {#each entry[1] as word, _ (word)}
    function create_each_block_1(key_1, ctx) {
    	let p;
    	let t_value = /*word*/ ctx[4] + "";
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
    			attr_dev(p, "class", "item svelte-8e6fra");
    			add_location(p, file, 36, 8, 634);
    			this.first = p;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*$playerToWords*/ 1 && t_value !== (t_value = /*word*/ ctx[4] + "")) set_data_dev(t, t_value);
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
    					p_intro = create_in_transition(p, receive, { key: /*word*/ ctx[4] });
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
    		source: "(36:6) {#each entry[1] as word, _ (word)}",
    		ctx
    	});

    	return block;
    }

    // (32:2) {#each $playerToWords as entry}
    function create_each_block(ctx) {
    	let div1;
    	let div0;
    	let t0_value = /*entry*/ ctx[1][0] + "";
    	let t0;
    	let t1;
    	let p;
    	let t3;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t4;
    	let each_value_1 = /*entry*/ ctx[1][1];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*word*/ ctx[4];
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
    			t0 = text(t0_value);
    			t1 = space();
    			p = element("p");
    			p.textContent = "* * *";
    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			add_location(div0, file, 33, 6, 544);
    			attr_dev(p, "class", "svelte-8e6fra");
    			add_location(p, file, 34, 6, 572);
    			attr_dev(div1, "class", "card svelte-8e6fra");
    			add_location(div1, file, 32, 4, 519);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div1, t1);
    			append_dev(div1, p);
    			append_dev(div1, t3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div1, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$playerToWords*/ 1 && t0_value !== (t0_value = /*entry*/ ctx[1][0] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*$playerToWords*/ 1) {
    				each_value_1 = /*entry*/ ctx[1][1];
    				validate_each_argument(each_value_1);
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
    				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, div1, fix_and_destroy_block, create_each_block_1, t4, get_each_context_1);
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
    		source: "(32:2) {#each $playerToWords as entry}",
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

    			attr_dev(main, "class", "svelte-8e6fra");
    			add_location(main, file, 30, 0, 474);
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
    			if (dirty & /*$playerToWords*/ 1) {
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

    function instance($$self, $$props, $$invalidate) {
    	let $playerToWords;
    	validate_store(playerToWords, "playerToWords");
    	component_subscribe($$self, playerToWords, $$value => $$invalidate(0, $playerToWords = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PlayersGrid", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PlayersGrid> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		playerToWords,
    		receive,
    		flip,
    		$playerToWords
    	});

    	return [$playerToWords];
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

    /* src/PlayerTurn.svelte generated by Svelte v3.31.2 */
    const file$1 = "src/PlayerTurn.svelte";

    function create_fragment$1(ctx) {
    	let main;
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			main = element("main");
    			p = element("p");
    			t = text(/*turnText*/ ctx[0]);
    			add_location(p, file$1, 11, 2, 294);
    			add_location(main, file$1, 10, 0, 285);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, p);
    			append_dev(p, t);
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

    /* src/Word.svelte generated by Svelte v3.31.2 */
    const file$2 = "src/Word.svelte";

    function create_fragment$2(ctx) {
    	let main;

    	const block = {
    		c: function create() {
    			main = element("main");
    			add_location(main, file$2, 14, 0, 349);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			main.innerHTML = /*text*/ ctx[0];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*text*/ 1) main.innerHTML = /*text*/ ctx[0];		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
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

    function getText(word) {
    	if (word) {
    		if (word === "init") {
    			return "<p>Retrieving your word..</p>";
    		}

    		return `<p> Your word is </p>
      <p><b>${word}</b></p>`;
    	}

    	return "<p><b>You are Mr.white!</b></p>";
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let text;
    	let $ownWord;
    	validate_store(ownWord, "ownWord");
    	component_subscribe($$self, ownWord, $$value => $$invalidate(1, $ownWord = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Word", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Word> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ ownWord, getText, text, $ownWord });

    	$$self.$inject_state = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$ownWord*/ 2) {
    			 $$invalidate(0, text = getText($ownWord));
    		}
    	};

    	return [text, $ownWord];
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
    function getVoteAgainstPayload(player) {
        return {
            topic: 'vote',
            subtopic: 'against',
            data: player
        };
    }

    /* src/WordInput.svelte generated by Svelte v3.31.2 */
    const file$3 = "src/WordInput.svelte";

    function create_fragment$3(ctx) {
    	let main;
    	let input;
    	let t0;
    	let button;
    	let t1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			input = element("input");
    			t0 = space();
    			button = element("button");
    			t1 = text("Describe");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "svelte-16ysrrr");
    			add_location(input, file$3, 31, 4, 680);
    			button.disabled = /*disabledButton*/ ctx[1];
    			add_location(button, file$3, 32, 4, 764);
    			attr_dev(main, "class", "svelte-16ysrrr");
    			add_location(main, file$3, 29, 0, 608);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, input);
    			set_input_value(input, /*message*/ ctx[0]);
    			append_dev(main, t0);
    			append_dev(main, button);
    			append_dev(button, t1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[6]),
    					listen_dev(input, "keyup", prevent_default(/*handleKeyup*/ ctx[3]), false, true, false),
    					listen_dev(button, "click", /*handleClick*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*message*/ 1 && input.value !== /*message*/ ctx[0]) {
    				set_input_value(input, /*message*/ ctx[0]);
    			}

    			if (dirty & /*disabledButton*/ 2) {
    				prop_dev(button, "disabled", /*disabledButton*/ ctx[1]);
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let disabledButton;
    	let $currentPlayerTurn;
    	let $playerId;
    	validate_store(currentPlayerTurn, "currentPlayerTurn");
    	component_subscribe($$self, currentPlayerTurn, $$value => $$invalidate(4, $currentPlayerTurn = $$value));
    	validate_store(playerId, "playerId");
    	component_subscribe($$self, playerId, $$value => $$invalidate(5, $playerId = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("WordInput", slots, []);
    	let message = "";

    	// TODO check if word not already seen
    	function handleClick() {
    		if (message.length > 0) {
    			sendMessage(getAddWordPayload(message));
    			$$invalidate(0, message = "");
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

    	function input_input_handler() {
    		message = this.value;
    		$$invalidate(0, message);
    	}

    	$$self.$capture_state = () => ({
    		currentPlayerTurn,
    		playerId,
    		sendMessage,
    		getAddWordPayload,
    		message,
    		handleClick,
    		handleKeyup,
    		disabledButton,
    		$currentPlayerTurn,
    		$playerId
    	});

    	$$self.$inject_state = $$props => {
    		if ("message" in $$props) $$invalidate(0, message = $$props.message);
    		if ("disabledButton" in $$props) $$invalidate(1, disabledButton = $$props.disabledButton);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$currentPlayerTurn, $playerId*/ 48) {
    			 $$invalidate(1, disabledButton = $currentPlayerTurn !== $playerId);
    		}
    	};

    	return [
    		message,
    		disabledButton,
    		handleClick,
    		handleKeyup,
    		$currentPlayerTurn,
    		$playerId,
    		input_input_handler
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

    /* src/VotePicker.svelte generated by Svelte v3.31.2 */
    const file$4 = "src/VotePicker.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (24:4) {#if player !== $playerId}
    function create_if_block(ctx) {
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
    			attr_dev(button, "class", "svelte-1ci3dly");
    			add_location(button, file$4, 25, 8, 540);
    			add_location(p, file$4, 24, 6, 528);
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
    		id: create_if_block.name,
    		type: "if",
    		source: "(24:4) {#if player !== $playerId}",
    		ctx
    	});

    	return block;
    }

    // (23:2) {#each players as player, _ (player)}
    function create_each_block$1(key_1, ctx) {
    	let first;
    	let if_block_anchor;
    	let if_block = /*player*/ ctx[5] !== /*$playerId*/ ctx[1] && create_if_block(ctx);

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
    					if_block = create_if_block(ctx);
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
    		source: "(23:2) {#each players as player, _ (player)}",
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

    			attr_dev(h2, "class", "svelte-1ci3dly");
    			add_location(h2, file$4, 21, 2, 429);
    			add_location(main, file$4, 20, 0, 420);
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
    	let $playerStore;
    	let $playerId;
    	validate_store(playerStore, "playerStore");
    	component_subscribe($$self, playerStore, $$value => $$invalidate(3, $playerStore = $$value));
    	validate_store(playerId, "playerId");
    	component_subscribe($$self, playerId, $$value => $$invalidate(1, $playerId = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("VotePicker", slots, []);

    	function handleClick(selected) {
    		sendMessage(getVoteAgainstPayload(selected));
    		hasVoted.set(true);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<VotePicker> was created with unknown prop '${key}'`);
    	});

    	const click_handler = player => handleClick(player);

    	$$self.$capture_state = () => ({
    		playerStore,
    		playerId,
    		sendMessage,
    		hasVoted,
    		getVoteAgainstPayload,
    		handleClick,
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
    		if ($$self.$$.dirty & /*$playerStore*/ 8) {
    			 $$invalidate(0, players = $playerStore);
    		}
    	};

    	return [players, $playerId, handleClick, $playerStore, click_handler];
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

    /* src/HasVoted.svelte generated by Svelte v3.31.2 */
    const file$5 = "src/HasVoted.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	child_ctx[4] = i;
    	return child_ctx;
    }

    // (29:2) {#each $playersWhoVoted as player, _ (player) }
    function create_each_block$2(key_1, ctx) {
    	let div;
    	let t_value = `${/*player*/ ctx[2]} ` + "";
    	let t;
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
    			t = text(t_value);
    			attr_dev(div, "class", "item svelte-194m0yb");
    			add_location(div, file$5, 29, 4, 580);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*$playersWhoVoted*/ 1) && t_value !== (t_value = `${/*player*/ ctx[2]} ` + "")) set_data_dev(t, t_value);
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
    		source: "(29:2) {#each $playersWhoVoted as player, _ (player) }",
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

    			attr_dev(h2, "class", "svelte-194m0yb");
    			add_location(h2, file$5, 26, 2, 503);
    			add_location(br, file$5, 27, 2, 521);
    			attr_dev(main, "class", "svelte-194m0yb");
    			add_location(main, file$5, 25, 0, 494);
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

    /* src/WaitingForVote.svelte generated by Svelte v3.31.2 */

    const file$6 = "src/WaitingForVote.svelte";

    function create_fragment$6(ctx) {
    	let h2;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Waiting for vote completion..";
    			attr_dev(h2, "class", "svelte-ydyzfp");
    			add_location(h2, file$6, 8, 0, 100);
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

    /* src/VoteScreen.svelte generated by Svelte v3.31.2 */
    const file$7 = "src/VoteScreen.svelte";

    // (18:2) {#if $state === "init"}
    function create_if_block_1(ctx) {
    	let div;
    	let votepicker;
    	let t0;
    	let hasvoted;
    	let t1;
    	let playersgrid;
    	let div_outro;
    	let current;
    	let mounted;
    	let dispose;
    	votepicker = new VotePicker({ $$inline: true });
    	hasvoted = new HasVoted({ $$inline: true });
    	playersgrid = new PlayersGrid({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(votepicker.$$.fragment);
    			t0 = space();
    			create_component(hasvoted.$$.fragment);
    			t1 = space();
    			create_component(playersgrid.$$.fragment);
    			add_location(div, file$7, 18, 4, 502);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(votepicker, div, null);
    			append_dev(div, t0);
    			mount_component(hasvoted, div, null);
    			append_dev(div, t1);
    			mount_component(playersgrid, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "outroend", /*onOutro*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(votepicker.$$.fragment, local);
    			transition_in(hasvoted.$$.fragment, local);
    			transition_in(playersgrid.$$.fragment, local);
    			if (div_outro) div_outro.end(1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(votepicker.$$.fragment, local);
    			transition_out(hasvoted.$$.fragment, local);
    			transition_out(playersgrid.$$.fragment, local);
    			div_outro = create_out_transition(div, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(votepicker);
    			destroy_component(hasvoted);
    			destroy_component(playersgrid);
    			if (detaching && div_outro) div_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(18:2) {#if $state === \\\"init\\\"}",
    		ctx
    	});

    	return block;
    }

    // (25:2) {#if $state === "voted"}
    function create_if_block$1(ctx) {
    	let div;
    	let waitingforvote;
    	let t;
    	let hasvoted;
    	let div_intro;
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
    			add_location(div, file$7, 25, 4, 651);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(waitingforvote, div, null);
    			append_dev(div, t);
    			mount_component(hasvoted, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "outroend", /*onOutro*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(waitingforvote.$$.fragment, local);
    			transition_in(hasvoted.$$.fragment, local);

    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, fade, {});
    					div_intro.start();
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(waitingforvote.$$.fragment, local);
    			transition_out(hasvoted.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(waitingforvote);
    			destroy_component(hasvoted);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(25:2) {#if $state === \\\"voted\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let main;
    	let t;
    	let current;
    	let if_block0 = /*$state*/ ctx[0] === "init" && create_if_block_1(ctx);
    	let if_block1 = /*$state*/ ctx[0] === "voted" && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			add_location(main, file$7, 16, 0, 465);
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
    					if_block0 = create_if_block_1(ctx);
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

    			if (/*$state*/ ctx[0] === "voted") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*$state*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$1(ctx);
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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $hasVoted;
    	let $state;
    	validate_store(hasVoted, "hasVoted");
    	component_subscribe($$self, hasVoted, $$value => $$invalidate(3, $hasVoted = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("VoteScreen", slots, []);
    	const { onOutro, transitionTo, state } = statefulSwap("init");
    	validate_store(state, "state");
    	component_subscribe($$self, state, value => $$invalidate(0, $state = value));
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<VoteScreen> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		VotePicker,
    		statefulSwap,
    		HasVoted,
    		PlayersGrid,
    		hasVoted,
    		fade,
    		WaitingForVote,
    		onOutro,
    		transitionTo,
    		state,
    		$hasVoted,
    		$state
    	});

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$hasVoted*/ 8) {
    			 if ($hasVoted) {
    				transitionTo("voted");
    			}
    		}
    	};

    	return [$state, onOutro, state, $hasVoted];
    }

    class VoteScreen extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "VoteScreen",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/GameBoard.svelte generated by Svelte v3.31.2 */
    const file$8 = "src/GameBoard.svelte";

    // (16:2) {#if $state === "started"}
    function create_if_block_1$1(ctx) {
    	let div;
    	let word;
    	let t0;
    	let playerturn;
    	let t1;
    	let wordinput;
    	let t2;
    	let br;
    	let t3;
    	let playersgrid;
    	let div_intro;
    	let div_outro;
    	let current;
    	let mounted;
    	let dispose;
    	word = new Word({ $$inline: true });
    	playerturn = new PlayerTurn({ $$inline: true });
    	wordinput = new WordInput({ $$inline: true });
    	playersgrid = new PlayersGrid({ $$inline: true });

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
    			create_component(playersgrid.$$.fragment);
    			add_location(br, file$8, 22, 4, 699);
    			add_location(div, file$8, 16, 2, 534);
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
    			mount_component(playersgrid, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "outroend", /*onOutro*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(word.$$.fragment, local);
    			transition_in(playerturn.$$.fragment, local);
    			transition_in(wordinput.$$.fragment, local);
    			transition_in(playersgrid.$$.fragment, local);

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, fly, { y: 500, duration: 300 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(word.$$.fragment, local);
    			transition_out(playerturn.$$.fragment, local);
    			transition_out(wordinput.$$.fragment, local);
    			transition_out(playersgrid.$$.fragment, local);
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fly, { y: 500, duration: 300 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(word);
    			destroy_component(playerturn);
    			destroy_component(wordinput);
    			destroy_component(playersgrid);
    			if (detaching && div_outro) div_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(16:2) {#if $state === \\\"started\\\"}",
    		ctx
    	});

    	return block;
    }

    // (28:2) {#if $state === "voting"}
    function create_if_block$2(ctx) {
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
    			add_location(div, file$8, 28, 2, 772);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(votescreen, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "outroend", /*onOutro*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(votescreen.$$.fragment, local);

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, fly, { y: 500, duration: 300 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(votescreen.$$.fragment, local);
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fly, { y: 500, duration: 300 });
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
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(28:2) {#if $state === \\\"voting\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let main;
    	let t;
    	let current;
    	let if_block0 = /*$state*/ ctx[0] === "started" && create_if_block_1$1(ctx);
    	let if_block1 = /*$state*/ ctx[0] === "voting" && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			add_location(main, file$8, 14, 0, 496);
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
    			if (/*$state*/ ctx[0] === "started") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*$state*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
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

    			if (/*$state*/ ctx[0] === "voting") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*$state*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$2(ctx);
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $playingState;
    	let $state;
    	validate_store(playingState, "playingState");
    	component_subscribe($$self, playingState, $$value => $$invalidate(3, $playingState = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("GameBoard", slots, []);
    	const { onOutro, transitionTo, state } = statefulSwap("started");
    	validate_store(state, "state");
    	component_subscribe($$self, state, value => $$invalidate(0, $state = value));
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GameBoard> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		PlayersGrid,
    		PlayerTurn,
    		Word,
    		WordInput,
    		statefulSwap,
    		fly,
    		playingState,
    		VoteScreen,
    		onOutro,
    		transitionTo,
    		state,
    		$playingState,
    		$state
    	});

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$playingState*/ 8) {
    			 if ($playingState) {
    				transitionTo($playingState);
    			}
    		}
    	};

    	return [$state, onOutro, state, $playingState];
    }

    class GameBoard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GameBoard",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/NameInput.svelte generated by Svelte v3.31.2 */
    const file$9 = "src/NameInput.svelte";

    function create_fragment$9(ctx) {
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
    			attr_dev(h1, "class", "svelte-4w4a9t");
    			add_location(h1, file$9, 53, 2, 931);
    			attr_dev(h2, "class", "svelte-4w4a9t");
    			add_location(h2, file$9, 54, 2, 955);
    			add_location(br0, file$9, 55, 2, 984);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "size", "15");
    			attr_dev(input, "class", "svelte-4w4a9t");
    			add_location(input, file$9, 56, 2, 991);
    			add_location(br1, file$9, 60, 2, 1097);
    			attr_dev(button, "class", "svelte-4w4a9t");
    			add_location(button, file$9, 61, 2, 1104);
    			add_location(main, file$9, 52, 0, 922);
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
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NameInput",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/PlayerList.svelte generated by Svelte v3.31.2 */
    const file$a = "src/PlayerList.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	child_ctx[5] = i;
    	return child_ctx;
    }

    // (22:2) {#each players as player, _ (player)}
    function create_each_block$3(key_1, ctx) {
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
    			add_location(p, file$a, 22, 4, 517);
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
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(22:2) {#each players as player, _ (player)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let main;
    	let h2;
    	let t1;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value = /*players*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*player*/ ctx[3];
    	validate_each_keys(ctx, each_value, get_each_context$3, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$3(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$3(key, child_ctx));
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

    			attr_dev(h2, "class", "svelte-dk8aud");
    			add_location(h2, file$a, 20, 2, 446);
    			add_location(main, file$a, 19, 0, 437);
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
    				validate_each_keys(ctx, each_value, get_each_context$3, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, main, fix_and_outro_and_destroy_block, create_each_block$3, null, get_each_context$3);
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
    		id: create_fragment$a.name,
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

    function instance$a($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PlayerList",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/Settings.svelte generated by Svelte v3.31.2 */
    const file$b = "src/Settings.svelte";

    function create_fragment$b(ctx) {
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
    			attr_dev(h2, "class", "svelte-15h6cuf");
    			add_location(h2, file$b, 38, 2, 660);
    			add_location(p0, file$b, 39, 2, 682);
    			attr_dev(button0, "class", "svelte-15h6cuf");
    			add_location(button0, file$b, 40, 2, 702);
    			attr_dev(div0, "class", "svelte-15h6cuf");
    			add_location(div0, file$b, 41, 2, 785);
    			attr_dev(button1, "class", "svelte-15h6cuf");
    			add_location(button1, file$b, 42, 2, 817);
    			add_location(p1, file$b, 43, 2, 900);
    			attr_dev(button2, "class", "svelte-15h6cuf");
    			add_location(button2, file$b, 44, 2, 918);
    			attr_dev(div1, "class", "svelte-15h6cuf");
    			add_location(div1, file$b, 45, 2, 996);
    			attr_dev(button3, "class", "svelte-15h6cuf");
    			add_location(button3, file$b, 46, 2, 1025);
    			attr_dev(main, "class", "svelte-15h6cuf");
    			add_location(main, file$b, 37, 0, 651);
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
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/StartButton.svelte generated by Svelte v3.31.2 */
    const file$c = "src/StartButton.svelte";

    function create_fragment$c(ctx) {
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text("Start");
    			button.disabled = /*disabledButton*/ ctx[0];
    			add_location(button, file$c, 20, 0, 716);
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
    		id: create_fragment$c.name,
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

    function instance$c($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StartButton",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src/Lobby.svelte generated by Svelte v3.31.2 */
    const file$d = "src/Lobby.svelte";

    // (15:1) {#if $state === "init"}
    function create_if_block_1$2(ctx) {
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
    			add_location(div, file$d, 15, 4, 482);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(nameinput, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "outroend", /*onOutro*/ ctx[2], false, false, false);
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
    			div_outro = create_out_transition(div, fly, { y: 500, duration: 300 });
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
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(15:1) {#if $state === \\\"init\\\"}",
    		ctx
    	});

    	return block;
    }

    // (20:2) {#if $state === $playerId}
    function create_if_block$3(ctx) {
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
    			add_location(br0, file$d, 22, 6, 709);
    			add_location(br1, file$d, 24, 6, 742);
    			add_location(div, file$d, 20, 4, 619);
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
    				dispose = listen_dev(div, "outroend", /*onOutro*/ ctx[2], false, false, false);
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
    					div_intro = create_in_transition(div, fly, { y: 500, duration: 500 });
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
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(20:2) {#if $state === $playerId}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let main;
    	let t;
    	let current;
    	let if_block0 = /*$state*/ ctx[1] === "init" && create_if_block_1$2(ctx);
    	let if_block1 = /*$state*/ ctx[1] === /*$playerId*/ ctx[0] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			add_location(main, file$d, 13, 0, 446);
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
    			if (/*$state*/ ctx[1] === "init") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*$state*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1$2(ctx);
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

    			if (/*$state*/ ctx[1] === /*$playerId*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*$state, $playerId*/ 3) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$3(ctx);
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
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let $playerId;
    	let $state;
    	validate_store(playerId, "playerId");
    	component_subscribe($$self, playerId, $$value => $$invalidate(0, $playerId = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Lobby", slots, []);
    	const { onOutro, transitionTo, state } = statefulSwap("init");
    	validate_store(state, "state");
    	component_subscribe($$self, state, value => $$invalidate(1, $state = value));
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
    		if ($$self.$$.dirty & /*$playerId*/ 1) {
    			 if ($playerId) {
    				transitionTo($playerId);
    			}
    		}
    	};

    	return [$playerId, $state, onOutro, state];
    }

    class Lobby extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Lobby",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.31.2 */
    const file$e = "src/App.svelte";

    // (13:1) {#if $state === 'init'}
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
    			add_location(div, file$e, 13, 2, 399);
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
    			div_outro = create_out_transition(div, fly, { y: 500, duration: 300 });
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
    		source: "(13:1) {#if $state === 'init'}",
    		ctx
    	});

    	return block;
    }

    // (18:1) {#if $state === 'started'}
    function create_if_block$4(ctx) {
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
    			add_location(div, file$e, 18, 2, 524);
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
    					div_intro = create_in_transition(div, fly, { y: 500, duration: 500 });
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
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(18:1) {#if $state === 'started'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let main;
    	let t;
    	let current;
    	let if_block0 = /*$state*/ ctx[0] === "init" && create_if_block_1$3(ctx);
    	let if_block1 = /*$state*/ ctx[0] === "started" && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(main, "class", "svelte-yg16s0");
    			add_location(main, file$e, 11, 0, 365);
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
    					if_block1 = create_if_block$4(ctx);
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
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
