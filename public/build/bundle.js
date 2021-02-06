
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
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
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

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    var LoggerOptions = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    (function (LogLevel) {
        LogLevel[LogLevel["Trace"] = 0] = "Trace";
        LogLevel[LogLevel["Debug"] = 1] = "Debug";
        LogLevel[LogLevel["Info"] = 2] = "Info";
        LogLevel[LogLevel["Warn"] = 3] = "Warn";
        LogLevel[LogLevel["Error"] = 4] = "Error";
        LogLevel[LogLevel["Fatal"] = 5] = "Fatal";
    })(exports.LogLevel || (exports.LogLevel = {}));
    /* tslint:disable:no-namespace */
    (function (LogLevel) {
        /**
         * Returns LogLevel based on string representation
         * @param val Value
         * @returns {LogLevel}, Error is thrown if invalid.
         */
        function fromString(val) {
            if (val == null) {
                throw new Error("Argument must be set");
            }
            switch (val.toLowerCase()) {
                case "trace":
                    return LogLevel.Trace;
                case "debug":
                    return LogLevel.Debug;
                case "info":
                    return LogLevel.Info;
                case "warn":
                    return LogLevel.Warn;
                case "error":
                    return LogLevel.Error;
                case "fatal":
                    return LogLevel.Fatal;
                default:
                    throw new Error("Unsupported value for conversion: " + val);
            }
        }
        LogLevel.fromString = fromString;
    })(exports.LogLevel || (exports.LogLevel = {}));
    (function (LoggerType) {
        LoggerType[LoggerType["Console"] = 0] = "Console";
        LoggerType[LoggerType["MessageBuffer"] = 1] = "MessageBuffer";
        LoggerType[LoggerType["Custom"] = 2] = "Custom";
    })(exports.LoggerType || (exports.LoggerType = {}));
    /**
     * Defines several date enums used for formatting a date.
     */
    var DateFormatEnum;
    (function (DateFormatEnum) {
        /**
         * Displays as: year-month-day hour:minute:second,millis -> 1999-02-12 23:59:59,123
         * Note the date separator can be set separately.
         */
        DateFormatEnum[DateFormatEnum["Default"] = 0] = "Default";
        /**
         * Displays as: year-month-day hour:minute:second -> 1999-02-12 23:59:59
         * Note the date separator can be set separately.
         */
        DateFormatEnum[DateFormatEnum["YearMonthDayTime"] = 1] = "YearMonthDayTime";
        /**
         * Displays as: year-day-month hour:minute:second,millis -> 1999-12-02 23:59:59,123
         * Note the date separator can be set separately.
         */
        DateFormatEnum[DateFormatEnum["YearDayMonthWithFullTime"] = 2] = "YearDayMonthWithFullTime";
        /**
         * Displays as: year-day-month hour:minute:second -> 1999-12-02 23:59:59
         * Note the date separator can be set separately.
         */
        DateFormatEnum[DateFormatEnum["YearDayMonthTime"] = 3] = "YearDayMonthTime";
    })(DateFormatEnum = exports.DateFormatEnum || (exports.DateFormatEnum = {}));
    /* tslint:disable:no-namespace */
    (function (DateFormatEnum) {
        /**
         * Returns LogLevel based on string representation
         * @param val Value
         * @returns {LogLevel}, Error is thrown if invalid.
         */
        function fromString(val) {
            if (val == null) {
                throw new Error("Argument must be set");
            }
            switch (val.toLowerCase()) {
                case "default":
                    return DateFormatEnum.Default;
                case "yearmonthdayTime":
                    return DateFormatEnum.YearMonthDayTime;
                case "yeardaymonthwithfulltime":
                    return DateFormatEnum.YearDayMonthWithFullTime;
                case "yeardaymonthtime":
                    return DateFormatEnum.YearDayMonthTime;
                default:
                    throw new Error("Unsupported value for conversion: " + val);
            }
        }
        DateFormatEnum.fromString = fromString;
    })(DateFormatEnum = exports.DateFormatEnum || (exports.DateFormatEnum = {}));
    /* tslint:disable:enable-namespace */
    /**
     * DateFormat class, stores data on how to format a date.
     */
    var DateFormat = (function () {
        /**
         * Constructor to define the dateformat used for logging, can be called empty as it uses defaults.
         * @param formatEnum DateFormatEnum, use one of the constants from the enum. Defaults to DateFormatEnum.Default
         * @param dateSeparator Separator used between dates, defaults to -
         */
        function DateFormat(formatEnum, dateSeparator) {
            if (formatEnum === void 0) { formatEnum = DateFormatEnum.Default; }
            if (dateSeparator === void 0) { dateSeparator = "-"; }
            this._formatEnum = formatEnum;
            this._dateSeparator = dateSeparator;
        }
        Object.defineProperty(DateFormat.prototype, "formatEnum", {
            get: function () {
                return this._formatEnum;
            },
            set: function (value) {
                this._formatEnum = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DateFormat.prototype, "dateSeparator", {
            get: function () {
                return this._dateSeparator;
            },
            set: function (value) {
                this._dateSeparator = value;
            },
            enumerable: true,
            configurable: true
        });
        DateFormat.prototype.copy = function () {
            return new DateFormat(this._formatEnum, this._dateSeparator);
        };
        return DateFormat;
    }());
    exports.DateFormat = DateFormat;
    /**
     * Information about the log format, what will a log line look like?
     */
    var LogFormat = (function () {
        /**
         * Constructor to create a LogFormat. Can be created without parameters where it will use sane defaults.
         * @param dateFormat DateFormat (what needs the date look like in the log line)
         * @param showTimeStamp Show date timestamp at all?
         * @param showLoggerName Show the logger name?
         */
        function LogFormat(dateFormat, showTimeStamp, showLoggerName) {
            if (dateFormat === void 0) { dateFormat = new DateFormat(); }
            if (showTimeStamp === void 0) { showTimeStamp = true; }
            if (showLoggerName === void 0) { showLoggerName = true; }
            this._showTimeStamp = true;
            this._showLoggerName = true;
            this._dateFormat = dateFormat;
            this._showTimeStamp = showTimeStamp;
            this._showLoggerName = showLoggerName;
        }
        Object.defineProperty(LogFormat.prototype, "dateFormat", {
            get: function () {
                return this._dateFormat;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LogFormat.prototype, "showTimeStamp", {
            get: function () {
                return this._showTimeStamp;
            },
            set: function (value) {
                this._showTimeStamp = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LogFormat.prototype, "showLoggerName", {
            get: function () {
                return this._showLoggerName;
            },
            set: function (value) {
                this._showLoggerName = value;
            },
            enumerable: true,
            configurable: true
        });
        return LogFormat;
    }());
    exports.LogFormat = LogFormat;
    /**
     * Information about the log format, what will a log line look like?
     */
    var CategoryLogFormat = (function () {
        /**
         * Create an instance defining the category log format used.
         * @param dateFormat Date format (uses default), for details see DateFormat class.
         * @param showTimeStamp True to show timestamp in the logging, defaults to true.
         * @param showCategoryName True to show category name in the logging, defaults to true.
         */
        function CategoryLogFormat(dateFormat, showTimeStamp, showCategoryName) {
            if (dateFormat === void 0) { dateFormat = new DateFormat(); }
            if (showTimeStamp === void 0) { showTimeStamp = true; }
            if (showCategoryName === void 0) { showCategoryName = true; }
            this._dateFormat = dateFormat;
            this._showTimeStamp = showTimeStamp;
            this._showCategoryName = showCategoryName;
        }
        Object.defineProperty(CategoryLogFormat.prototype, "dateFormat", {
            get: function () {
                return this._dateFormat;
            },
            set: function (value) {
                this._dateFormat = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CategoryLogFormat.prototype, "showTimeStamp", {
            get: function () {
                return this._showTimeStamp;
            },
            set: function (value) {
                this._showTimeStamp = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CategoryLogFormat.prototype, "showCategoryName", {
            get: function () {
                return this._showCategoryName;
            },
            set: function (value) {
                this._showCategoryName = value;
            },
            enumerable: true,
            configurable: true
        });
        CategoryLogFormat.prototype.copy = function () {
            return new CategoryLogFormat(this._dateFormat.copy(), this._showTimeStamp, this._showCategoryName);
        };
        return CategoryLogFormat;
    }());
    exports.CategoryLogFormat = CategoryLogFormat;

    });

    var LinkedNode = (function () {
        function LinkedNode(value) {
            this._previous = null;
            this._next = null;
            this._value = value;
        }
        Object.defineProperty(LinkedNode.prototype, "previous", {
            get: function () {
                return this._previous;
            },
            set: function (value) {
                this._previous = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LinkedNode.prototype, "next", {
            get: function () {
                return this._next;
            },
            set: function (value) {
                this._next = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LinkedNode.prototype, "value", {
            get: function () {
                return this._value;
            },
            enumerable: true,
            configurable: true
        });
        return LinkedNode;
    }());
    /**
     * Double linkedlist implementation.
     */
    var LinkedList = (function () {
        function LinkedList() {
            this.head = null;
            this.size = 0;
        }
        LinkedList.prototype.addHead = function (value) {
            if (!this.createHeadIfNeeded(value)) {
                if (this.head != null) {
                    var nextNode = this.head.next;
                    var newHeadNode = new LinkedNode(value);
                    if (nextNode != null) {
                        nextNode.previous = newHeadNode;
                        newHeadNode.next = nextNode;
                    }
                    this.head = newHeadNode;
                }
                else {
                    throw new Error("This should never happen, list implementation broken");
                }
            }
            this.size++;
        };
        LinkedList.prototype.addTail = function (value) {
            if (!this.createHeadIfNeeded(value)) {
                var oldTailNode = this.getTailNode();
                if (oldTailNode != null) {
                    var newTailNode = new LinkedNode(value);
                    oldTailNode.next = newTailNode;
                    newTailNode.previous = oldTailNode;
                }
                else {
                    throw new Error("List implementation broken");
                }
            }
            this.size++;
        };
        LinkedList.prototype.clear = function () {
            this.head = null;
            this.size = 0;
        };
        LinkedList.prototype.getHead = function () {
            if (this.head != null) {
                return this.head.value;
            }
            return null;
        };
        LinkedList.prototype.removeHead = function () {
            if (this.head != null) {
                var oldHead = this.head;
                var value = oldHead.value;
                this.head = oldHead.next;
                this.size--;
                return value;
            }
            return null;
        };
        LinkedList.prototype.getTail = function () {
            var node = this.getTailNode();
            if (node != null) {
                return node.value;
            }
            return null;
        };
        LinkedList.prototype.removeTail = function () {
            var node = this.getTailNode();
            if (node != null) {
                if (node === this.head) {
                    this.head = null;
                }
                else {
                    var previousNode = node.previous;
                    if (previousNode != null) {
                        previousNode.next = null;
                    }
                    else {
                        throw new Error("List implementation is broken");
                    }
                }
                this.size--;
                return node.value;
            }
            return null;
        };
        LinkedList.prototype.getSize = function () {
            return this.size;
        };
        LinkedList.prototype.filter = function (f) {
            var recurse = function (fn, node, values) {
                if (fn(node.value)) {
                    values.push(node.value);
                }
                var nextNode = node.next;
                if (nextNode != null) {
                    recurse(fn, nextNode, values);
                }
            };
            var result = [];
            var currentNode = this.head;
            if (currentNode != null) {
                recurse(f, currentNode, result);
            }
            return result;
        };
        LinkedList.prototype.createHeadIfNeeded = function (value) {
            if (this.head == null) {
                this.head = new LinkedNode(value);
                return true;
            }
            return false;
        };
        LinkedList.prototype.getTailNode = function () {
            if (this.head == null) {
                return null;
            }
            var node = this.head;
            while (node.next != null) {
                node = node.next;
            }
            return node;
        };
        return LinkedList;
    }());
    var LinkedList_1 = LinkedList;
    /**
     * Map implementation keyed by string (always).
     */
    var SimpleMap = (function () {
        function SimpleMap() {
            this.array = {};
        }
        SimpleMap.prototype.put = function (key, value) {
            this.array[key] = value;
        };
        SimpleMap.prototype.get = function (key) {
            return this.array[key];
        };
        SimpleMap.prototype.exists = function (key) {
            var value = this.array[key];
            return (typeof value !== "undefined");
        };
        SimpleMap.prototype.remove = function (key) {
            var value = this.array[key];
            if (typeof value !== "undefined") {
                delete this.array[key];
            }
            return value;
        };
        SimpleMap.prototype.keys = function () {
            var keys = [];
            for (var key in this.array) {
                // To prevent random stuff to appear
                if (this.array.hasOwnProperty(key)) {
                    keys.push(key);
                }
            }
            return keys;
        };
        SimpleMap.prototype.values = function () {
            var values = [];
            for (var key in this.array) {
                // To prevent random stuff to appear
                if (this.array.hasOwnProperty(key)) {
                    values.push(this.get(key));
                }
            }
            return values;
        };
        SimpleMap.prototype.size = function () {
            return this.keys().length;
        };
        SimpleMap.prototype.isEmpty = function () {
            return this.size() === 0;
        };
        SimpleMap.prototype.clear = function () {
            this.array = {};
        };
        SimpleMap.prototype.forEach = function (cbFunction) {
            var count = 0;
            for (var key in this.array) {
                // To prevent random stuff to appear
                if (this.array.hasOwnProperty(key)) {
                    var value = this.array[key];
                    cbFunction(key, value, count);
                    count++;
                }
            }
        };
        SimpleMap.prototype.forEachValue = function (cbFunction) {
            var count = 0;
            for (var key in this.array) {
                // To prevent random stuff to appear
                if (this.array.hasOwnProperty(key)) {
                    var value = this.array[key];
                    cbFunction(value, count);
                    count++;
                }
            }
        };
        return SimpleMap;
    }());
    var SimpleMap_1 = SimpleMap;
    /**
     * Tuple to hold two values.
     */
    var TuplePair = (function () {
        function TuplePair(x, y) {
            this._x = x;
            this._y = y;
        }
        Object.defineProperty(TuplePair.prototype, "x", {
            get: function () {
                return this._x;
            },
            set: function (value) {
                this._x = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TuplePair.prototype, "y", {
            get: function () {
                return this._y;
            },
            set: function (value) {
                this._y = value;
            },
            enumerable: true,
            configurable: true
        });
        return TuplePair;
    }());
    var TuplePair_1 = TuplePair;
    /**
     * Utility class to build up a string.
     */
    var StringBuilder = (function () {
        function StringBuilder() {
            this.data = [];
        }
        StringBuilder.prototype.append = function (line) {
            if (line === undefined || line == null) {
                throw new Error("String must be set, cannot append null or undefined");
            }
            this.data.push(line);
            return this;
        };
        StringBuilder.prototype.appendLine = function (line) {
            this.data.push(line + "\n");
            return this;
        };
        StringBuilder.prototype.isEmpty = function () {
            return this.data.length === 0;
        };
        StringBuilder.prototype.clear = function () {
            this.data = [];
        };
        StringBuilder.prototype.toString = function (separator) {
            if (separator === void 0) { separator = ""; }
            return this.data.join(separator);
        };
        return StringBuilder;
    }());
    var StringBuilder_1 = StringBuilder;


    var DataStructures = /*#__PURE__*/Object.defineProperty({
    	LinkedList: LinkedList_1,
    	SimpleMap: SimpleMap_1,
    	TuplePair: TuplePair_1,
    	StringBuilder: StringBuilder_1
    }, '__esModule', {value: true});

    var stackframe = createCommonjsModule(function (module, exports) {
    (function (root, factory) {
        // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

        /* istanbul ignore next */
        {
            module.exports = factory();
        }
    }(commonjsGlobal, function () {
        function _isNumber(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }

        function StackFrame(functionName, args, fileName, lineNumber, columnNumber, source) {
            if (functionName !== undefined) {
                this.setFunctionName(functionName);
            }
            if (args !== undefined) {
                this.setArgs(args);
            }
            if (fileName !== undefined) {
                this.setFileName(fileName);
            }
            if (lineNumber !== undefined) {
                this.setLineNumber(lineNumber);
            }
            if (columnNumber !== undefined) {
                this.setColumnNumber(columnNumber);
            }
            if (source !== undefined) {
                this.setSource(source);
            }
        }

        StackFrame.prototype = {
            getFunctionName: function () {
                return this.functionName;
            },
            setFunctionName: function (v) {
                this.functionName = String(v);
            },

            getArgs: function () {
                return this.args;
            },
            setArgs: function (v) {
                if (Object.prototype.toString.call(v) !== '[object Array]') {
                    throw new TypeError('Args must be an Array');
                }
                this.args = v;
            },

            // NOTE: Property name may be misleading as it includes the path,
            // but it somewhat mirrors V8's JavaScriptStackTraceApi
            // https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi and Gecko's
            // http://mxr.mozilla.org/mozilla-central/source/xpcom/base/nsIException.idl#14
            getFileName: function () {
                return this.fileName;
            },
            setFileName: function (v) {
                this.fileName = String(v);
            },

            getLineNumber: function () {
                return this.lineNumber;
            },
            setLineNumber: function (v) {
                if (!_isNumber(v)) {
                    throw new TypeError('Line Number must be a Number');
                }
                this.lineNumber = Number(v);
            },

            getColumnNumber: function () {
                return this.columnNumber;
            },
            setColumnNumber: function (v) {
                if (!_isNumber(v)) {
                    throw new TypeError('Column Number must be a Number');
                }
                this.columnNumber = Number(v);
            },

            getSource: function () {
                return this.source;
            },
            setSource: function (v) {
                this.source = String(v);
            },

            toString: function() {
                var functionName = this.getFunctionName() || '{anonymous}';
                var args = '(' + (this.getArgs() || []).join(',') + ')';
                var fileName = this.getFileName() ? ('@' + this.getFileName()) : '';
                var lineNumber = _isNumber(this.getLineNumber()) ? (':' + this.getLineNumber()) : '';
                var columnNumber = _isNumber(this.getColumnNumber()) ? (':' + this.getColumnNumber()) : '';
                return functionName + args + fileName + lineNumber + columnNumber;
            }
        };

        return StackFrame;
    }));
    });

    var errorStackParser = createCommonjsModule(function (module, exports) {
    (function(root, factory) {
        // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

        /* istanbul ignore next */
        {
            module.exports = factory(stackframe);
        }
    }(commonjsGlobal, function ErrorStackParser(StackFrame) {

        var FIREFOX_SAFARI_STACK_REGEXP = /(^|@)\S+\:\d+/;
        var CHROME_IE_STACK_REGEXP = /^\s*at .*(\S+\:\d+|\(native\))/m;
        var SAFARI_NATIVE_CODE_REGEXP = /^(eval@)?(\[native code\])?$/;

        function _map(array, fn, thisArg) {
            if (typeof Array.prototype.map === 'function') {
                return array.map(fn, thisArg);
            } else {
                var output = new Array(array.length);
                for (var i = 0; i < array.length; i++) {
                    output[i] = fn.call(thisArg, array[i]);
                }
                return output;
            }
        }

        function _filter(array, fn, thisArg) {
            if (typeof Array.prototype.filter === 'function') {
                return array.filter(fn, thisArg);
            } else {
                var output = [];
                for (var i = 0; i < array.length; i++) {
                    if (fn.call(thisArg, array[i])) {
                        output.push(array[i]);
                    }
                }
                return output;
            }
        }

        function _indexOf(array, target) {
            if (typeof Array.prototype.indexOf === 'function') {
                return array.indexOf(target);
            } else {
                for (var i = 0; i < array.length; i++) {
                    if (array[i] === target) {
                        return i;
                    }
                }
                return -1;
            }
        }

        return {
            /**
             * Given an Error object, extract the most information from it.
             *
             * @param {Error} error object
             * @return {Array} of StackFrames
             */
            parse: function ErrorStackParser$$parse(error) {
                if (typeof error.stacktrace !== 'undefined' || typeof error['opera#sourceloc'] !== 'undefined') {
                    return this.parseOpera(error);
                } else if (error.stack && error.stack.match(CHROME_IE_STACK_REGEXP)) {
                    return this.parseV8OrIE(error);
                } else if (error.stack) {
                    return this.parseFFOrSafari(error);
                } else {
                    throw new Error('Cannot parse given Error object');
                }
            },

            // Separate line and column numbers from a string of the form: (URI:Line:Column)
            extractLocation: function ErrorStackParser$$extractLocation(urlLike) {
                // Fail-fast but return locations like "(native)"
                if (urlLike.indexOf(':') === -1) {
                    return [urlLike];
                }

                var regExp = /(.+?)(?:\:(\d+))?(?:\:(\d+))?$/;
                var parts = regExp.exec(urlLike.replace(/[\(\)]/g, ''));
                return [parts[1], parts[2] || undefined, parts[3] || undefined];
            },

            parseV8OrIE: function ErrorStackParser$$parseV8OrIE(error) {
                var filtered = _filter(error.stack.split('\n'), function(line) {
                    return !!line.match(CHROME_IE_STACK_REGEXP);
                }, this);

                return _map(filtered, function(line) {
                    if (line.indexOf('(eval ') > -1) {
                        // Throw away eval information until we implement stacktrace.js/stackframe#8
                        line = line.replace(/eval code/g, 'eval').replace(/(\(eval at [^\()]*)|(\)\,.*$)/g, '');
                    }
                    var tokens = line.replace(/^\s+/, '').replace(/\(eval code/g, '(').split(/\s+/).slice(1);
                    var locationParts = this.extractLocation(tokens.pop());
                    var functionName = tokens.join(' ') || undefined;
                    var fileName = _indexOf(['eval', '<anonymous>'], locationParts[0]) > -1 ? undefined : locationParts[0];

                    return new StackFrame(functionName, undefined, fileName, locationParts[1], locationParts[2], line);
                }, this);
            },

            parseFFOrSafari: function ErrorStackParser$$parseFFOrSafari(error) {
                var filtered = _filter(error.stack.split('\n'), function(line) {
                    return !line.match(SAFARI_NATIVE_CODE_REGEXP);
                }, this);

                return _map(filtered, function(line) {
                    // Throw away eval information until we implement stacktrace.js/stackframe#8
                    if (line.indexOf(' > eval') > -1) {
                        line = line.replace(/ line (\d+)(?: > eval line \d+)* > eval\:\d+\:\d+/g, ':$1');
                    }

                    if (line.indexOf('@') === -1 && line.indexOf(':') === -1) {
                        // Safari eval frames only have function names and nothing else
                        return new StackFrame(line);
                    } else {
                        var tokens = line.split('@');
                        var locationParts = this.extractLocation(tokens.pop());
                        var functionName = tokens.join('@') || undefined;
                        return new StackFrame(functionName,
                            undefined,
                            locationParts[0],
                            locationParts[1],
                            locationParts[2],
                            line);
                    }
                }, this);
            },

            parseOpera: function ErrorStackParser$$parseOpera(e) {
                if (!e.stacktrace || (e.message.indexOf('\n') > -1 &&
                    e.message.split('\n').length > e.stacktrace.split('\n').length)) {
                    return this.parseOpera9(e);
                } else if (!e.stack) {
                    return this.parseOpera10(e);
                } else {
                    return this.parseOpera11(e);
                }
            },

            parseOpera9: function ErrorStackParser$$parseOpera9(e) {
                var lineRE = /Line (\d+).*script (?:in )?(\S+)/i;
                var lines = e.message.split('\n');
                var result = [];

                for (var i = 2, len = lines.length; i < len; i += 2) {
                    var match = lineRE.exec(lines[i]);
                    if (match) {
                        result.push(new StackFrame(undefined, undefined, match[2], match[1], undefined, lines[i]));
                    }
                }

                return result;
            },

            parseOpera10: function ErrorStackParser$$parseOpera10(e) {
                var lineRE = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;
                var lines = e.stacktrace.split('\n');
                var result = [];

                for (var i = 0, len = lines.length; i < len; i += 2) {
                    var match = lineRE.exec(lines[i]);
                    if (match) {
                        result.push(
                            new StackFrame(
                                match[3] || undefined,
                                undefined,
                                match[2],
                                match[1],
                                undefined,
                                lines[i]
                            )
                        );
                    }
                }

                return result;
            },

            // Opera 10.65+ Error.stack very similar to FF/Safari
            parseOpera11: function ErrorStackParser$$parseOpera11(error) {
                var filtered = _filter(error.stack.split('\n'), function(line) {
                    return !!line.match(FIREFOX_SAFARI_STACK_REGEXP) && !line.match(/^Error created at/);
                }, this);

                return _map(filtered, function(line) {
                    var tokens = line.split('@');
                    var locationParts = this.extractLocation(tokens.pop());
                    var functionCall = (tokens.shift() || '');
                    var functionName = functionCall
                            .replace(/<anonymous function(: (\w+))?>/, '$2')
                            .replace(/\([^\)]*\)/g, '') || undefined;
                    var argsRaw;
                    if (functionCall.match(/\(([^\)]*)\)/)) {
                        argsRaw = functionCall.replace(/^[^\(]+\(([^\)]*)\)$/, '$1');
                    }
                    var args = (argsRaw === undefined || argsRaw === '[arguments not available]') ?
                        undefined : argsRaw.split(',');
                    return new StackFrame(
                        functionName,
                        args,
                        locationParts[0],
                        locationParts[1],
                        locationParts[2],
                        line);
                }, this);
            }
        };
    }));
    });

    var stackframe$1 = createCommonjsModule(function (module, exports) {
    (function(root, factory) {
        // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

        /* istanbul ignore next */
        {
            module.exports = factory();
        }
    }(commonjsGlobal, function() {
        function _isNumber(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }

        function _capitalize(str) {
            return str.charAt(0).toUpperCase() + str.substring(1);
        }

        function _getter(p) {
            return function() {
                return this[p];
            };
        }

        var booleanProps = ['isConstructor', 'isEval', 'isNative', 'isToplevel'];
        var numericProps = ['columnNumber', 'lineNumber'];
        var stringProps = ['fileName', 'functionName', 'source'];
        var arrayProps = ['args'];
        var objectProps = ['evalOrigin'];

        var props = booleanProps.concat(numericProps, stringProps, arrayProps, objectProps);

        function StackFrame(obj) {
            if (!obj) return;
            for (var i = 0; i < props.length; i++) {
                if (obj[props[i]] !== undefined) {
                    this['set' + _capitalize(props[i])](obj[props[i]]);
                }
            }
        }

        StackFrame.prototype = {
            getArgs: function() {
                return this.args;
            },
            setArgs: function(v) {
                if (Object.prototype.toString.call(v) !== '[object Array]') {
                    throw new TypeError('Args must be an Array');
                }
                this.args = v;
            },

            getEvalOrigin: function() {
                return this.evalOrigin;
            },
            setEvalOrigin: function(v) {
                if (v instanceof StackFrame) {
                    this.evalOrigin = v;
                } else if (v instanceof Object) {
                    this.evalOrigin = new StackFrame(v);
                } else {
                    throw new TypeError('Eval Origin must be an Object or StackFrame');
                }
            },

            toString: function() {
                var fileName = this.getFileName() || '';
                var lineNumber = this.getLineNumber() || '';
                var columnNumber = this.getColumnNumber() || '';
                var functionName = this.getFunctionName() || '';
                if (this.getIsEval()) {
                    if (fileName) {
                        return '[eval] (' + fileName + ':' + lineNumber + ':' + columnNumber + ')';
                    }
                    return '[eval]:' + lineNumber + ':' + columnNumber;
                }
                if (functionName) {
                    return functionName + ' (' + fileName + ':' + lineNumber + ':' + columnNumber + ')';
                }
                return fileName + ':' + lineNumber + ':' + columnNumber;
            }
        };

        StackFrame.fromString = function StackFrame$$fromString(str) {
            var argsStartIndex = str.indexOf('(');
            var argsEndIndex = str.lastIndexOf(')');

            var functionName = str.substring(0, argsStartIndex);
            var args = str.substring(argsStartIndex + 1, argsEndIndex).split(',');
            var locationString = str.substring(argsEndIndex + 1);

            if (locationString.indexOf('@') === 0) {
                var parts = /@(.+?)(?::(\d+))?(?::(\d+))?$/.exec(locationString, '');
                var fileName = parts[1];
                var lineNumber = parts[2];
                var columnNumber = parts[3];
            }

            return new StackFrame({
                functionName: functionName,
                args: args || undefined,
                fileName: fileName,
                lineNumber: lineNumber || undefined,
                columnNumber: columnNumber || undefined
            });
        };

        for (var i = 0; i < booleanProps.length; i++) {
            StackFrame.prototype['get' + _capitalize(booleanProps[i])] = _getter(booleanProps[i]);
            StackFrame.prototype['set' + _capitalize(booleanProps[i])] = (function(p) {
                return function(v) {
                    this[p] = Boolean(v);
                };
            })(booleanProps[i]);
        }

        for (var j = 0; j < numericProps.length; j++) {
            StackFrame.prototype['get' + _capitalize(numericProps[j])] = _getter(numericProps[j]);
            StackFrame.prototype['set' + _capitalize(numericProps[j])] = (function(p) {
                return function(v) {
                    if (!_isNumber(v)) {
                        throw new TypeError(p + ' must be a Number');
                    }
                    this[p] = Number(v);
                };
            })(numericProps[j]);
        }

        for (var k = 0; k < stringProps.length; k++) {
            StackFrame.prototype['get' + _capitalize(stringProps[k])] = _getter(stringProps[k]);
            StackFrame.prototype['set' + _capitalize(stringProps[k])] = (function(p) {
                return function(v) {
                    this[p] = String(v);
                };
            })(stringProps[k]);
        }

        return StackFrame;
    }));
    });

    var stackGenerator = createCommonjsModule(function (module, exports) {
    (function (root, factory) {
        // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

        /* istanbul ignore next */
        {
            module.exports = factory(stackframe$1);
        }
    }(commonjsGlobal, function (StackFrame) {
        return {
            backtrace: function StackGenerator$$backtrace(opts) {
                var stack = [];
                var maxStackSize = 10;

                if (typeof opts === 'object' && typeof opts.maxStackSize === 'number') {
                    maxStackSize = opts.maxStackSize;
                }

                var curr = arguments.callee;
                while (curr && stack.length < maxStackSize) {
                    // Allow V8 optimizations
                    var args = new Array(curr['arguments'].length);
                    for(var i = 0; i < args.length; ++i) {
                        args[i] = curr['arguments'][i];
                    }
                    if (/function(?:\s+([\w$]+))+\s*\(/.test(curr.toString())) {
                        stack.push(new StackFrame({functionName: RegExp.$1 || undefined, args: args}));
                    } else {
                        stack.push(new StackFrame({args: args}));
                    }

                    try {
                        curr = curr.caller;
                    } catch (e) {
                        break;
                    }
                }
                return stack;
            }
        };
    }));
    });

    /* -*- Mode: js; js-indent-level: 2; -*- */

    var util = createCommonjsModule(function (module, exports) {
    /*
     * Copyright 2011 Mozilla Foundation and contributors
     * Licensed under the New BSD license. See LICENSE or:
     * http://opensource.org/licenses/BSD-3-Clause
     */

    /**
     * This is a helper function for getting values from parameter/options
     * objects.
     *
     * @param args The object we are extracting values from
     * @param name The name of the property we are getting.
     * @param defaultValue An optional value to return if the property is missing
     * from the object. If this is not specified and the property is missing, an
     * error will be thrown.
     */
    function getArg(aArgs, aName, aDefaultValue) {
      if (aName in aArgs) {
        return aArgs[aName];
      } else if (arguments.length === 3) {
        return aDefaultValue;
      } else {
        throw new Error('"' + aName + '" is a required argument.');
      }
    }
    exports.getArg = getArg;

    var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.]*)(?::(\d+))?(\S*)$/;
    var dataUrlRegexp = /^data:.+\,.+$/;

    function urlParse(aUrl) {
      var match = aUrl.match(urlRegexp);
      if (!match) {
        return null;
      }
      return {
        scheme: match[1],
        auth: match[2],
        host: match[3],
        port: match[4],
        path: match[5]
      };
    }
    exports.urlParse = urlParse;

    function urlGenerate(aParsedUrl) {
      var url = '';
      if (aParsedUrl.scheme) {
        url += aParsedUrl.scheme + ':';
      }
      url += '//';
      if (aParsedUrl.auth) {
        url += aParsedUrl.auth + '@';
      }
      if (aParsedUrl.host) {
        url += aParsedUrl.host;
      }
      if (aParsedUrl.port) {
        url += ":" + aParsedUrl.port;
      }
      if (aParsedUrl.path) {
        url += aParsedUrl.path;
      }
      return url;
    }
    exports.urlGenerate = urlGenerate;

    /**
     * Normalizes a path, or the path portion of a URL:
     *
     * - Replaces consecutive slashes with one slash.
     * - Removes unnecessary '.' parts.
     * - Removes unnecessary '<dir>/..' parts.
     *
     * Based on code in the Node.js 'path' core module.
     *
     * @param aPath The path or url to normalize.
     */
    function normalize(aPath) {
      var path = aPath;
      var url = urlParse(aPath);
      if (url) {
        if (!url.path) {
          return aPath;
        }
        path = url.path;
      }
      var isAbsolute = exports.isAbsolute(path);

      var parts = path.split(/\/+/);
      for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
        part = parts[i];
        if (part === '.') {
          parts.splice(i, 1);
        } else if (part === '..') {
          up++;
        } else if (up > 0) {
          if (part === '') {
            // The first part is blank if the path is absolute. Trying to go
            // above the root is a no-op. Therefore we can remove all '..' parts
            // directly after the root.
            parts.splice(i + 1, up);
            up = 0;
          } else {
            parts.splice(i, 2);
            up--;
          }
        }
      }
      path = parts.join('/');

      if (path === '') {
        path = isAbsolute ? '/' : '.';
      }

      if (url) {
        url.path = path;
        return urlGenerate(url);
      }
      return path;
    }
    exports.normalize = normalize;

    /**
     * Joins two paths/URLs.
     *
     * @param aRoot The root path or URL.
     * @param aPath The path or URL to be joined with the root.
     *
     * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
     *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
     *   first.
     * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
     *   is updated with the result and aRoot is returned. Otherwise the result
     *   is returned.
     *   - If aPath is absolute, the result is aPath.
     *   - Otherwise the two paths are joined with a slash.
     * - Joining for example 'http://' and 'www.example.com' is also supported.
     */
    function join(aRoot, aPath) {
      if (aRoot === "") {
        aRoot = ".";
      }
      if (aPath === "") {
        aPath = ".";
      }
      var aPathUrl = urlParse(aPath);
      var aRootUrl = urlParse(aRoot);
      if (aRootUrl) {
        aRoot = aRootUrl.path || '/';
      }

      // `join(foo, '//www.example.org')`
      if (aPathUrl && !aPathUrl.scheme) {
        if (aRootUrl) {
          aPathUrl.scheme = aRootUrl.scheme;
        }
        return urlGenerate(aPathUrl);
      }

      if (aPathUrl || aPath.match(dataUrlRegexp)) {
        return aPath;
      }

      // `join('http://', 'www.example.com')`
      if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
        aRootUrl.host = aPath;
        return urlGenerate(aRootUrl);
      }

      var joined = aPath.charAt(0) === '/'
        ? aPath
        : normalize(aRoot.replace(/\/+$/, '') + '/' + aPath);

      if (aRootUrl) {
        aRootUrl.path = joined;
        return urlGenerate(aRootUrl);
      }
      return joined;
    }
    exports.join = join;

    exports.isAbsolute = function (aPath) {
      return aPath.charAt(0) === '/' || !!aPath.match(urlRegexp);
    };

    /**
     * Make a path relative to a URL or another path.
     *
     * @param aRoot The root path or URL.
     * @param aPath The path or URL to be made relative to aRoot.
     */
    function relative(aRoot, aPath) {
      if (aRoot === "") {
        aRoot = ".";
      }

      aRoot = aRoot.replace(/\/$/, '');

      // It is possible for the path to be above the root. In this case, simply
      // checking whether the root is a prefix of the path won't work. Instead, we
      // need to remove components from the root one by one, until either we find
      // a prefix that fits, or we run out of components to remove.
      var level = 0;
      while (aPath.indexOf(aRoot + '/') !== 0) {
        var index = aRoot.lastIndexOf("/");
        if (index < 0) {
          return aPath;
        }

        // If the only part of the root that is left is the scheme (i.e. http://,
        // file:///, etc.), one or more slashes (/), or simply nothing at all, we
        // have exhausted all components, so the path is not relative to the root.
        aRoot = aRoot.slice(0, index);
        if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
          return aPath;
        }

        ++level;
      }

      // Make sure we add a "../" for each component we removed from the root.
      return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
    }
    exports.relative = relative;

    var supportsNullProto = (function () {
      var obj = Object.create(null);
      return !('__proto__' in obj);
    }());

    function identity (s) {
      return s;
    }

    /**
     * Because behavior goes wacky when you set `__proto__` on objects, we
     * have to prefix all the strings in our set with an arbitrary character.
     *
     * See https://github.com/mozilla/source-map/pull/31 and
     * https://github.com/mozilla/source-map/issues/30
     *
     * @param String aStr
     */
    function toSetString(aStr) {
      if (isProtoString(aStr)) {
        return '$' + aStr;
      }

      return aStr;
    }
    exports.toSetString = supportsNullProto ? identity : toSetString;

    function fromSetString(aStr) {
      if (isProtoString(aStr)) {
        return aStr.slice(1);
      }

      return aStr;
    }
    exports.fromSetString = supportsNullProto ? identity : fromSetString;

    function isProtoString(s) {
      if (!s) {
        return false;
      }

      var length = s.length;

      if (length < 9 /* "__proto__".length */) {
        return false;
      }

      if (s.charCodeAt(length - 1) !== 95  /* '_' */ ||
          s.charCodeAt(length - 2) !== 95  /* '_' */ ||
          s.charCodeAt(length - 3) !== 111 /* 'o' */ ||
          s.charCodeAt(length - 4) !== 116 /* 't' */ ||
          s.charCodeAt(length - 5) !== 111 /* 'o' */ ||
          s.charCodeAt(length - 6) !== 114 /* 'r' */ ||
          s.charCodeAt(length - 7) !== 112 /* 'p' */ ||
          s.charCodeAt(length - 8) !== 95  /* '_' */ ||
          s.charCodeAt(length - 9) !== 95  /* '_' */) {
        return false;
      }

      for (var i = length - 10; i >= 0; i--) {
        if (s.charCodeAt(i) !== 36 /* '$' */) {
          return false;
        }
      }

      return true;
    }

    /**
     * Comparator between two mappings where the original positions are compared.
     *
     * Optionally pass in `true` as `onlyCompareGenerated` to consider two
     * mappings with the same original source/line/column, but different generated
     * line and column the same. Useful when searching for a mapping with a
     * stubbed out mapping.
     */
    function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
      var cmp = mappingA.source - mappingB.source;
      if (cmp !== 0) {
        return cmp;
      }

      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }

      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0 || onlyCompareOriginal) {
        return cmp;
      }

      cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0) {
        return cmp;
      }

      cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp !== 0) {
        return cmp;
      }

      return mappingA.name - mappingB.name;
    }
    exports.compareByOriginalPositions = compareByOriginalPositions;

    /**
     * Comparator between two mappings with deflated source and name indices where
     * the generated positions are compared.
     *
     * Optionally pass in `true` as `onlyCompareGenerated` to consider two
     * mappings with the same generated line and column, but different
     * source/name/original line and column the same. Useful when searching for a
     * mapping with a stubbed out mapping.
     */
    function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
      var cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp !== 0) {
        return cmp;
      }

      cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0 || onlyCompareGenerated) {
        return cmp;
      }

      cmp = mappingA.source - mappingB.source;
      if (cmp !== 0) {
        return cmp;
      }

      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }

      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0) {
        return cmp;
      }

      return mappingA.name - mappingB.name;
    }
    exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;

    function strcmp(aStr1, aStr2) {
      if (aStr1 === aStr2) {
        return 0;
      }

      if (aStr1 > aStr2) {
        return 1;
      }

      return -1;
    }

    /**
     * Comparator between two mappings with inflated source and name strings where
     * the generated positions are compared.
     */
    function compareByGeneratedPositionsInflated(mappingA, mappingB) {
      var cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp !== 0) {
        return cmp;
      }

      cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0) {
        return cmp;
      }

      cmp = strcmp(mappingA.source, mappingB.source);
      if (cmp !== 0) {
        return cmp;
      }

      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }

      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0) {
        return cmp;
      }

      return strcmp(mappingA.name, mappingB.name);
    }
    exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;
    });

    /* -*- Mode: js; js-indent-level: 2; -*- */

    var binarySearch = createCommonjsModule(function (module, exports) {
    /*
     * Copyright 2011 Mozilla Foundation and contributors
     * Licensed under the New BSD license. See LICENSE or:
     * http://opensource.org/licenses/BSD-3-Clause
     */

    exports.GREATEST_LOWER_BOUND = 1;
    exports.LEAST_UPPER_BOUND = 2;

    /**
     * Recursive implementation of binary search.
     *
     * @param aLow Indices here and lower do not contain the needle.
     * @param aHigh Indices here and higher do not contain the needle.
     * @param aNeedle The element being searched for.
     * @param aHaystack The non-empty array being searched.
     * @param aCompare Function which takes two elements and returns -1, 0, or 1.
     * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
     *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
     *     closest element that is smaller than or greater than the one we are
     *     searching for, respectively, if the exact element cannot be found.
     */
    function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
      // This function terminates when one of the following is true:
      //
      //   1. We find the exact element we are looking for.
      //
      //   2. We did not find the exact element, but we can return the index of
      //      the next-closest element.
      //
      //   3. We did not find the exact element, and there is no next-closest
      //      element than the one we are searching for, so we return -1.
      var mid = Math.floor((aHigh - aLow) / 2) + aLow;
      var cmp = aCompare(aNeedle, aHaystack[mid], true);
      if (cmp === 0) {
        // Found the element we are looking for.
        return mid;
      }
      else if (cmp > 0) {
        // Our needle is greater than aHaystack[mid].
        if (aHigh - mid > 1) {
          // The element is in the upper half.
          return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
        }

        // The exact needle element was not found in this haystack. Determine if
        // we are in termination case (3) or (2) and return the appropriate thing.
        if (aBias == exports.LEAST_UPPER_BOUND) {
          return aHigh < aHaystack.length ? aHigh : -1;
        } else {
          return mid;
        }
      }
      else {
        // Our needle is less than aHaystack[mid].
        if (mid - aLow > 1) {
          // The element is in the lower half.
          return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
        }

        // we are in termination case (3) or (2) and return the appropriate thing.
        if (aBias == exports.LEAST_UPPER_BOUND) {
          return mid;
        } else {
          return aLow < 0 ? -1 : aLow;
        }
      }
    }

    /**
     * This is an implementation of binary search which will always try and return
     * the index of the closest element if there is no exact hit. This is because
     * mappings between original and generated line/col pairs are single points,
     * and there is an implicit region between each of them, so a miss just means
     * that you aren't on the very start of a region.
     *
     * @param aNeedle The element you are looking for.
     * @param aHaystack The array that is being searched.
     * @param aCompare A function which takes the needle and an element in the
     *     array and returns -1, 0, or 1 depending on whether the needle is less
     *     than, equal to, or greater than the element, respectively.
     * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
     *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
     *     closest element that is smaller than or greater than the one we are
     *     searching for, respectively, if the exact element cannot be found.
     *     Defaults to 'binarySearch.GREATEST_LOWER_BOUND'.
     */
    exports.search = function search(aNeedle, aHaystack, aCompare, aBias) {
      if (aHaystack.length === 0) {
        return -1;
      }

      var index = recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack,
                                  aCompare, aBias || exports.GREATEST_LOWER_BOUND);
      if (index < 0) {
        return -1;
      }

      // We have found either the exact element, or the next-closest element than
      // the one we are searching for. However, there may be more than one such
      // element. Make sure we always return the smallest of these.
      while (index - 1 >= 0) {
        if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
          break;
        }
        --index;
      }

      return index;
    };
    });

    /* -*- Mode: js; js-indent-level: 2; -*- */

    /*
     * Copyright 2011 Mozilla Foundation and contributors
     * Licensed under the New BSD license. See LICENSE or:
     * http://opensource.org/licenses/BSD-3-Clause
     */


    var has = Object.prototype.hasOwnProperty;

    /**
     * A data structure which is a combination of an array and a set. Adding a new
     * member is O(1), testing for membership is O(1), and finding the index of an
     * element is O(1). Removing elements from the set is not supported. Only
     * strings are supported for membership.
     */
    function ArraySet() {
      this._array = [];
      this._set = Object.create(null);
    }

    /**
     * Static method for creating ArraySet instances from an existing array.
     */
    ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
      var set = new ArraySet();
      for (var i = 0, len = aArray.length; i < len; i++) {
        set.add(aArray[i], aAllowDuplicates);
      }
      return set;
    };

    /**
     * Return how many unique items are in this ArraySet. If duplicates have been
     * added, than those do not count towards the size.
     *
     * @returns Number
     */
    ArraySet.prototype.size = function ArraySet_size() {
      return Object.getOwnPropertyNames(this._set).length;
    };

    /**
     * Add the given string to this set.
     *
     * @param String aStr
     */
    ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
      var sStr = util.toSetString(aStr);
      var isDuplicate = has.call(this._set, sStr);
      var idx = this._array.length;
      if (!isDuplicate || aAllowDuplicates) {
        this._array.push(aStr);
      }
      if (!isDuplicate) {
        this._set[sStr] = idx;
      }
    };

    /**
     * Is the given string a member of this set?
     *
     * @param String aStr
     */
    ArraySet.prototype.has = function ArraySet_has(aStr) {
      var sStr = util.toSetString(aStr);
      return has.call(this._set, sStr);
    };

    /**
     * What is the index of the given string in the array?
     *
     * @param String aStr
     */
    ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
      var sStr = util.toSetString(aStr);
      if (has.call(this._set, sStr)) {
        return this._set[sStr];
      }
      throw new Error('"' + aStr + '" is not in the set.');
    };

    /**
     * What is the element at the given index?
     *
     * @param Number aIdx
     */
    ArraySet.prototype.at = function ArraySet_at(aIdx) {
      if (aIdx >= 0 && aIdx < this._array.length) {
        return this._array[aIdx];
      }
      throw new Error('No element indexed by ' + aIdx);
    };

    /**
     * Returns the array representation of this set (which has the proper indices
     * indicated by indexOf). Note that this is a copy of the internal array used
     * for storing the members so that no one can mess with internal state.
     */
    ArraySet.prototype.toArray = function ArraySet_toArray() {
      return this._array.slice();
    };

    var ArraySet_1 = ArraySet;

    var arraySet = {
    	ArraySet: ArraySet_1
    };

    /* -*- Mode: js; js-indent-level: 2; -*- */
    /*
     * Copyright 2011 Mozilla Foundation and contributors
     * Licensed under the New BSD license. See LICENSE or:
     * http://opensource.org/licenses/BSD-3-Clause
     */

    var intToCharMap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');

    /**
     * Encode an integer in the range of 0 to 63 to a single base 64 digit.
     */
    var encode = function (number) {
      if (0 <= number && number < intToCharMap.length) {
        return intToCharMap[number];
      }
      throw new TypeError("Must be between 0 and 63: " + number);
    };

    /**
     * Decode a single base 64 character code digit to an integer. Returns -1 on
     * failure.
     */
    var decode = function (charCode) {
      var bigA = 65;     // 'A'
      var bigZ = 90;     // 'Z'

      var littleA = 97;  // 'a'
      var littleZ = 122; // 'z'

      var zero = 48;     // '0'
      var nine = 57;     // '9'

      var plus = 43;     // '+'
      var slash = 47;    // '/'

      var littleOffset = 26;
      var numberOffset = 52;

      // 0 - 25: ABCDEFGHIJKLMNOPQRSTUVWXYZ
      if (bigA <= charCode && charCode <= bigZ) {
        return (charCode - bigA);
      }

      // 26 - 51: abcdefghijklmnopqrstuvwxyz
      if (littleA <= charCode && charCode <= littleZ) {
        return (charCode - littleA + littleOffset);
      }

      // 52 - 61: 0123456789
      if (zero <= charCode && charCode <= nine) {
        return (charCode - zero + numberOffset);
      }

      // 62: +
      if (charCode == plus) {
        return 62;
      }

      // 63: /
      if (charCode == slash) {
        return 63;
      }

      // Invalid base64 digit.
      return -1;
    };

    var base64 = {
    	encode: encode,
    	decode: decode
    };

    /* -*- Mode: js; js-indent-level: 2; -*- */

    /*
     * Copyright 2011 Mozilla Foundation and contributors
     * Licensed under the New BSD license. See LICENSE or:
     * http://opensource.org/licenses/BSD-3-Clause
     *
     * Based on the Base 64 VLQ implementation in Closure Compiler:
     * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
     *
     * Copyright 2011 The Closure Compiler Authors. All rights reserved.
     * Redistribution and use in source and binary forms, with or without
     * modification, are permitted provided that the following conditions are
     * met:
     *
     *  * Redistributions of source code must retain the above copyright
     *    notice, this list of conditions and the following disclaimer.
     *  * Redistributions in binary form must reproduce the above
     *    copyright notice, this list of conditions and the following
     *    disclaimer in the documentation and/or other materials provided
     *    with the distribution.
     *  * Neither the name of Google Inc. nor the names of its
     *    contributors may be used to endorse or promote products derived
     *    from this software without specific prior written permission.
     *
     * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
     * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
     * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
     * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
     * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
     * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
     * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
     * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
     * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
     * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
     * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
     */



    // A single base 64 digit can contain 6 bits of data. For the base 64 variable
    // length quantities we use in the source map spec, the first bit is the sign,
    // the next four bits are the actual value, and the 6th bit is the
    // continuation bit. The continuation bit tells us whether there are more
    // digits in this value following this digit.
    //
    //   Continuation
    //   |    Sign
    //   |    |
    //   V    V
    //   101011

    var VLQ_BASE_SHIFT = 5;

    // binary: 100000
    var VLQ_BASE = 1 << VLQ_BASE_SHIFT;

    // binary: 011111
    var VLQ_BASE_MASK = VLQ_BASE - 1;

    // binary: 100000
    var VLQ_CONTINUATION_BIT = VLQ_BASE;

    /**
     * Converts from a two-complement value to a value where the sign bit is
     * placed in the least significant bit.  For example, as decimals:
     *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
     *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
     */
    function toVLQSigned(aValue) {
      return aValue < 0
        ? ((-aValue) << 1) + 1
        : (aValue << 1) + 0;
    }

    /**
     * Converts to a two-complement value from a value where the sign bit is
     * placed in the least significant bit.  For example, as decimals:
     *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
     *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
     */
    function fromVLQSigned(aValue) {
      var isNegative = (aValue & 1) === 1;
      var shifted = aValue >> 1;
      return isNegative
        ? -shifted
        : shifted;
    }

    /**
     * Returns the base 64 VLQ encoded value.
     */
    var encode$1 = function base64VLQ_encode(aValue) {
      var encoded = "";
      var digit;

      var vlq = toVLQSigned(aValue);

      do {
        digit = vlq & VLQ_BASE_MASK;
        vlq >>>= VLQ_BASE_SHIFT;
        if (vlq > 0) {
          // There are still more digits in this value, so we must make sure the
          // continuation bit is marked.
          digit |= VLQ_CONTINUATION_BIT;
        }
        encoded += base64.encode(digit);
      } while (vlq > 0);

      return encoded;
    };

    /**
     * Decodes the next base 64 VLQ value from the given string and returns the
     * value and the rest of the string via the out parameter.
     */
    var decode$1 = function base64VLQ_decode(aStr, aIndex, aOutParam) {
      var strLen = aStr.length;
      var result = 0;
      var shift = 0;
      var continuation, digit;

      do {
        if (aIndex >= strLen) {
          throw new Error("Expected more digits in base 64 VLQ value.");
        }

        digit = base64.decode(aStr.charCodeAt(aIndex++));
        if (digit === -1) {
          throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
        }

        continuation = !!(digit & VLQ_CONTINUATION_BIT);
        digit &= VLQ_BASE_MASK;
        result = result + (digit << shift);
        shift += VLQ_BASE_SHIFT;
      } while (continuation);

      aOutParam.value = fromVLQSigned(result);
      aOutParam.rest = aIndex;
    };

    var base64Vlq = {
    	encode: encode$1,
    	decode: decode$1
    };

    /* -*- Mode: js; js-indent-level: 2; -*- */
    /*
     * Copyright 2011 Mozilla Foundation and contributors
     * Licensed under the New BSD license. See LICENSE or:
     * http://opensource.org/licenses/BSD-3-Clause
     */

    // It turns out that some (most?) JavaScript engines don't self-host
    // `Array.prototype.sort`. This makes sense because C++ will likely remain
    // faster than JS when doing raw CPU-intensive sorting. However, when using a
    // custom comparator function, calling back and forth between the VM's C++ and
    // JIT'd JS is rather slow *and* loses JIT type information, resulting in
    // worse generated code for the comparator function than would be optimal. In
    // fact, when sorting with a comparator, these costs outweigh the benefits of
    // sorting in C++. By using our own JS-implemented Quick Sort (below), we get
    // a ~3500ms mean speed-up in `bench/bench.html`.

    /**
     * Swap the elements indexed by `x` and `y` in the array `ary`.
     *
     * @param {Array} ary
     *        The array.
     * @param {Number} x
     *        The index of the first item.
     * @param {Number} y
     *        The index of the second item.
     */
    function swap(ary, x, y) {
      var temp = ary[x];
      ary[x] = ary[y];
      ary[y] = temp;
    }

    /**
     * Returns a random integer within the range `low .. high` inclusive.
     *
     * @param {Number} low
     *        The lower bound on the range.
     * @param {Number} high
     *        The upper bound on the range.
     */
    function randomIntInRange(low, high) {
      return Math.round(low + (Math.random() * (high - low)));
    }

    /**
     * The Quick Sort algorithm.
     *
     * @param {Array} ary
     *        An array to sort.
     * @param {function} comparator
     *        Function to use to compare two items.
     * @param {Number} p
     *        Start index of the array
     * @param {Number} r
     *        End index of the array
     */
    function doQuickSort(ary, comparator, p, r) {
      // If our lower bound is less than our upper bound, we (1) partition the
      // array into two pieces and (2) recurse on each half. If it is not, this is
      // the empty array and our base case.

      if (p < r) {
        // (1) Partitioning.
        //
        // The partitioning chooses a pivot between `p` and `r` and moves all
        // elements that are less than or equal to the pivot to the before it, and
        // all the elements that are greater than it after it. The effect is that
        // once partition is done, the pivot is in the exact place it will be when
        // the array is put in sorted order, and it will not need to be moved
        // again. This runs in O(n) time.

        // Always choose a random pivot so that an input array which is reverse
        // sorted does not cause O(n^2) running time.
        var pivotIndex = randomIntInRange(p, r);
        var i = p - 1;

        swap(ary, pivotIndex, r);
        var pivot = ary[r];

        // Immediately after `j` is incremented in this loop, the following hold
        // true:
        //
        //   * Every element in `ary[p .. i]` is less than or equal to the pivot.
        //
        //   * Every element in `ary[i+1 .. j-1]` is greater than the pivot.
        for (var j = p; j < r; j++) {
          if (comparator(ary[j], pivot) <= 0) {
            i += 1;
            swap(ary, i, j);
          }
        }

        swap(ary, i + 1, j);
        var q = i + 1;

        // (2) Recurse on each half.

        doQuickSort(ary, comparator, p, q - 1);
        doQuickSort(ary, comparator, q + 1, r);
      }
    }

    /**
     * Sort the given array in-place with the given comparator function.
     *
     * @param {Array} ary
     *        An array to sort.
     * @param {function} comparator
     *        Function to use to compare two items.
     */
    var quickSort_1 = function (ary, comparator) {
      doQuickSort(ary, comparator, 0, ary.length - 1);
    };

    var quickSort = {
    	quickSort: quickSort_1
    };

    /* -*- Mode: js; js-indent-level: 2; -*- */

    /*
     * Copyright 2011 Mozilla Foundation and contributors
     * Licensed under the New BSD license. See LICENSE or:
     * http://opensource.org/licenses/BSD-3-Clause
     */



    var ArraySet$1 = arraySet.ArraySet;

    var quickSort$1 = quickSort.quickSort;

    function SourceMapConsumer(aSourceMap) {
      var sourceMap = aSourceMap;
      if (typeof aSourceMap === 'string') {
        sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
      }

      return sourceMap.sections != null
        ? new IndexedSourceMapConsumer(sourceMap)
        : new BasicSourceMapConsumer(sourceMap);
    }

    SourceMapConsumer.fromSourceMap = function(aSourceMap) {
      return BasicSourceMapConsumer.fromSourceMap(aSourceMap);
    };

    /**
     * The version of the source mapping spec that we are consuming.
     */
    SourceMapConsumer.prototype._version = 3;

    // `__generatedMappings` and `__originalMappings` are arrays that hold the
    // parsed mapping coordinates from the source map's "mappings" attribute. They
    // are lazily instantiated, accessed via the `_generatedMappings` and
    // `_originalMappings` getters respectively, and we only parse the mappings
    // and create these arrays once queried for a source location. We jump through
    // these hoops because there can be many thousands of mappings, and parsing
    // them is expensive, so we only want to do it if we must.
    //
    // Each object in the arrays is of the form:
    //
    //     {
    //       generatedLine: The line number in the generated code,
    //       generatedColumn: The column number in the generated code,
    //       source: The path to the original source file that generated this
    //               chunk of code,
    //       originalLine: The line number in the original source that
    //                     corresponds to this chunk of generated code,
    //       originalColumn: The column number in the original source that
    //                       corresponds to this chunk of generated code,
    //       name: The name of the original symbol which generated this chunk of
    //             code.
    //     }
    //
    // All properties except for `generatedLine` and `generatedColumn` can be
    // `null`.
    //
    // `_generatedMappings` is ordered by the generated positions.
    //
    // `_originalMappings` is ordered by the original positions.

    SourceMapConsumer.prototype.__generatedMappings = null;
    Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {
      get: function () {
        if (!this.__generatedMappings) {
          this._parseMappings(this._mappings, this.sourceRoot);
        }

        return this.__generatedMappings;
      }
    });

    SourceMapConsumer.prototype.__originalMappings = null;
    Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {
      get: function () {
        if (!this.__originalMappings) {
          this._parseMappings(this._mappings, this.sourceRoot);
        }

        return this.__originalMappings;
      }
    });

    SourceMapConsumer.prototype._charIsMappingSeparator =
      function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
        var c = aStr.charAt(index);
        return c === ";" || c === ",";
      };

    /**
     * Parse the mappings in a string in to a data structure which we can easily
     * query (the ordered arrays in the `this.__generatedMappings` and
     * `this.__originalMappings` properties).
     */
    SourceMapConsumer.prototype._parseMappings =
      function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
        throw new Error("Subclasses must implement _parseMappings");
      };

    SourceMapConsumer.GENERATED_ORDER = 1;
    SourceMapConsumer.ORIGINAL_ORDER = 2;

    SourceMapConsumer.GREATEST_LOWER_BOUND = 1;
    SourceMapConsumer.LEAST_UPPER_BOUND = 2;

    /**
     * Iterate over each mapping between an original source/line/column and a
     * generated line/column in this source map.
     *
     * @param Function aCallback
     *        The function that is called with each mapping.
     * @param Object aContext
     *        Optional. If specified, this object will be the value of `this` every
     *        time that `aCallback` is called.
     * @param aOrder
     *        Either `SourceMapConsumer.GENERATED_ORDER` or
     *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
     *        iterate over the mappings sorted by the generated file's line/column
     *        order or the original's source/line/column order, respectively. Defaults to
     *        `SourceMapConsumer.GENERATED_ORDER`.
     */
    SourceMapConsumer.prototype.eachMapping =
      function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
        var context = aContext || null;
        var order = aOrder || SourceMapConsumer.GENERATED_ORDER;

        var mappings;
        switch (order) {
        case SourceMapConsumer.GENERATED_ORDER:
          mappings = this._generatedMappings;
          break;
        case SourceMapConsumer.ORIGINAL_ORDER:
          mappings = this._originalMappings;
          break;
        default:
          throw new Error("Unknown order of iteration.");
        }

        var sourceRoot = this.sourceRoot;
        mappings.map(function (mapping) {
          var source = mapping.source === null ? null : this._sources.at(mapping.source);
          if (source != null && sourceRoot != null) {
            source = util.join(sourceRoot, source);
          }
          return {
            source: source,
            generatedLine: mapping.generatedLine,
            generatedColumn: mapping.generatedColumn,
            originalLine: mapping.originalLine,
            originalColumn: mapping.originalColumn,
            name: mapping.name === null ? null : this._names.at(mapping.name)
          };
        }, this).forEach(aCallback, context);
      };

    /**
     * Returns all generated line and column information for the original source,
     * line, and column provided. If no column is provided, returns all mappings
     * corresponding to a either the line we are searching for or the next
     * closest line that has any mappings. Otherwise, returns all mappings
     * corresponding to the given line and either the column we are searching for
     * or the next closest column that has any offsets.
     *
     * The only argument is an object with the following properties:
     *
     *   - source: The filename of the original source.
     *   - line: The line number in the original source.
     *   - column: Optional. the column number in the original source.
     *
     * and an array of objects is returned, each with the following properties:
     *
     *   - line: The line number in the generated source, or null.
     *   - column: The column number in the generated source, or null.
     */
    SourceMapConsumer.prototype.allGeneratedPositionsFor =
      function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
        var line = util.getArg(aArgs, 'line');

        // When there is no exact match, BasicSourceMapConsumer.prototype._findMapping
        // returns the index of the closest mapping less than the needle. By
        // setting needle.originalColumn to 0, we thus find the last mapping for
        // the given line, provided such a mapping exists.
        var needle = {
          source: util.getArg(aArgs, 'source'),
          originalLine: line,
          originalColumn: util.getArg(aArgs, 'column', 0)
        };

        if (this.sourceRoot != null) {
          needle.source = util.relative(this.sourceRoot, needle.source);
        }
        if (!this._sources.has(needle.source)) {
          return [];
        }
        needle.source = this._sources.indexOf(needle.source);

        var mappings = [];

        var index = this._findMapping(needle,
                                      this._originalMappings,
                                      "originalLine",
                                      "originalColumn",
                                      util.compareByOriginalPositions,
                                      binarySearch.LEAST_UPPER_BOUND);
        if (index >= 0) {
          var mapping = this._originalMappings[index];

          if (aArgs.column === undefined) {
            var originalLine = mapping.originalLine;

            // Iterate until either we run out of mappings, or we run into
            // a mapping for a different line than the one we found. Since
            // mappings are sorted, this is guaranteed to find all mappings for
            // the line we found.
            while (mapping && mapping.originalLine === originalLine) {
              mappings.push({
                line: util.getArg(mapping, 'generatedLine', null),
                column: util.getArg(mapping, 'generatedColumn', null),
                lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
              });

              mapping = this._originalMappings[++index];
            }
          } else {
            var originalColumn = mapping.originalColumn;

            // Iterate until either we run out of mappings, or we run into
            // a mapping for a different line than the one we were searching for.
            // Since mappings are sorted, this is guaranteed to find all mappings for
            // the line we are searching for.
            while (mapping &&
                   mapping.originalLine === line &&
                   mapping.originalColumn == originalColumn) {
              mappings.push({
                line: util.getArg(mapping, 'generatedLine', null),
                column: util.getArg(mapping, 'generatedColumn', null),
                lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
              });

              mapping = this._originalMappings[++index];
            }
          }
        }

        return mappings;
      };

    var SourceMapConsumer_1 = SourceMapConsumer;

    /**
     * A BasicSourceMapConsumer instance represents a parsed source map which we can
     * query for information about the original file positions by giving it a file
     * position in the generated source.
     *
     * The only parameter is the raw source map (either as a JSON string, or
     * already parsed to an object). According to the spec, source maps have the
     * following attributes:
     *
     *   - version: Which version of the source map spec this map is following.
     *   - sources: An array of URLs to the original source files.
     *   - names: An array of identifiers which can be referrenced by individual mappings.
     *   - sourceRoot: Optional. The URL root from which all sources are relative.
     *   - sourcesContent: Optional. An array of contents of the original source files.
     *   - mappings: A string of base64 VLQs which contain the actual mappings.
     *   - file: Optional. The generated file this source map is associated with.
     *
     * Here is an example source map, taken from the source map spec[0]:
     *
     *     {
     *       version : 3,
     *       file: "out.js",
     *       sourceRoot : "",
     *       sources: ["foo.js", "bar.js"],
     *       names: ["src", "maps", "are", "fun"],
     *       mappings: "AA,AB;;ABCDE;"
     *     }
     *
     * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
     */
    function BasicSourceMapConsumer(aSourceMap) {
      var sourceMap = aSourceMap;
      if (typeof aSourceMap === 'string') {
        sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
      }

      var version = util.getArg(sourceMap, 'version');
      var sources = util.getArg(sourceMap, 'sources');
      // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
      // requires the array) to play nice here.
      var names = util.getArg(sourceMap, 'names', []);
      var sourceRoot = util.getArg(sourceMap, 'sourceRoot', null);
      var sourcesContent = util.getArg(sourceMap, 'sourcesContent', null);
      var mappings = util.getArg(sourceMap, 'mappings');
      var file = util.getArg(sourceMap, 'file', null);

      // Once again, Sass deviates from the spec and supplies the version as a
      // string rather than a number, so we use loose equality checking here.
      if (version != this._version) {
        throw new Error('Unsupported version: ' + version);
      }

      sources = sources
        .map(String)
        // Some source maps produce relative source paths like "./foo.js" instead of
        // "foo.js".  Normalize these first so that future comparisons will succeed.
        // See bugzil.la/1090768.
        .map(util.normalize)
        // Always ensure that absolute sources are internally stored relative to
        // the source root, if the source root is absolute. Not doing this would
        // be particularly problematic when the source root is a prefix of the
        // source (valid, but why??). See github issue #199 and bugzil.la/1188982.
        .map(function (source) {
          return sourceRoot && util.isAbsolute(sourceRoot) && util.isAbsolute(source)
            ? util.relative(sourceRoot, source)
            : source;
        });

      // Pass `true` below to allow duplicate names and sources. While source maps
      // are intended to be compressed and deduplicated, the TypeScript compiler
      // sometimes generates source maps with duplicates in them. See Github issue
      // #72 and bugzil.la/889492.
      this._names = ArraySet$1.fromArray(names.map(String), true);
      this._sources = ArraySet$1.fromArray(sources, true);

      this.sourceRoot = sourceRoot;
      this.sourcesContent = sourcesContent;
      this._mappings = mappings;
      this.file = file;
    }

    BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
    BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer;

    /**
     * Create a BasicSourceMapConsumer from a SourceMapGenerator.
     *
     * @param SourceMapGenerator aSourceMap
     *        The source map that will be consumed.
     * @returns BasicSourceMapConsumer
     */
    BasicSourceMapConsumer.fromSourceMap =
      function SourceMapConsumer_fromSourceMap(aSourceMap) {
        var smc = Object.create(BasicSourceMapConsumer.prototype);

        var names = smc._names = ArraySet$1.fromArray(aSourceMap._names.toArray(), true);
        var sources = smc._sources = ArraySet$1.fromArray(aSourceMap._sources.toArray(), true);
        smc.sourceRoot = aSourceMap._sourceRoot;
        smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(),
                                                                smc.sourceRoot);
        smc.file = aSourceMap._file;

        // Because we are modifying the entries (by converting string sources and
        // names to indices into the sources and names ArraySets), we have to make
        // a copy of the entry or else bad things happen. Shared mutable state
        // strikes again! See github issue #191.

        var generatedMappings = aSourceMap._mappings.toArray().slice();
        var destGeneratedMappings = smc.__generatedMappings = [];
        var destOriginalMappings = smc.__originalMappings = [];

        for (var i = 0, length = generatedMappings.length; i < length; i++) {
          var srcMapping = generatedMappings[i];
          var destMapping = new Mapping;
          destMapping.generatedLine = srcMapping.generatedLine;
          destMapping.generatedColumn = srcMapping.generatedColumn;

          if (srcMapping.source) {
            destMapping.source = sources.indexOf(srcMapping.source);
            destMapping.originalLine = srcMapping.originalLine;
            destMapping.originalColumn = srcMapping.originalColumn;

            if (srcMapping.name) {
              destMapping.name = names.indexOf(srcMapping.name);
            }

            destOriginalMappings.push(destMapping);
          }

          destGeneratedMappings.push(destMapping);
        }

        quickSort$1(smc.__originalMappings, util.compareByOriginalPositions);

        return smc;
      };

    /**
     * The version of the source mapping spec that we are consuming.
     */
    BasicSourceMapConsumer.prototype._version = 3;

    /**
     * The list of original sources.
     */
    Object.defineProperty(BasicSourceMapConsumer.prototype, 'sources', {
      get: function () {
        return this._sources.toArray().map(function (s) {
          return this.sourceRoot != null ? util.join(this.sourceRoot, s) : s;
        }, this);
      }
    });

    /**
     * Provide the JIT with a nice shape / hidden class.
     */
    function Mapping() {
      this.generatedLine = 0;
      this.generatedColumn = 0;
      this.source = null;
      this.originalLine = null;
      this.originalColumn = null;
      this.name = null;
    }

    /**
     * Parse the mappings in a string in to a data structure which we can easily
     * query (the ordered arrays in the `this.__generatedMappings` and
     * `this.__originalMappings` properties).
     */
    BasicSourceMapConsumer.prototype._parseMappings =
      function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
        var generatedLine = 1;
        var previousGeneratedColumn = 0;
        var previousOriginalLine = 0;
        var previousOriginalColumn = 0;
        var previousSource = 0;
        var previousName = 0;
        var length = aStr.length;
        var index = 0;
        var cachedSegments = {};
        var temp = {};
        var originalMappings = [];
        var generatedMappings = [];
        var mapping, str, segment, end, value;

        while (index < length) {
          if (aStr.charAt(index) === ';') {
            generatedLine++;
            index++;
            previousGeneratedColumn = 0;
          }
          else if (aStr.charAt(index) === ',') {
            index++;
          }
          else {
            mapping = new Mapping();
            mapping.generatedLine = generatedLine;

            // Because each offset is encoded relative to the previous one,
            // many segments often have the same encoding. We can exploit this
            // fact by caching the parsed variable length fields of each segment,
            // allowing us to avoid a second parse if we encounter the same
            // segment again.
            for (end = index; end < length; end++) {
              if (this._charIsMappingSeparator(aStr, end)) {
                break;
              }
            }
            str = aStr.slice(index, end);

            segment = cachedSegments[str];
            if (segment) {
              index += str.length;
            } else {
              segment = [];
              while (index < end) {
                base64Vlq.decode(aStr, index, temp);
                value = temp.value;
                index = temp.rest;
                segment.push(value);
              }

              if (segment.length === 2) {
                throw new Error('Found a source, but no line and column');
              }

              if (segment.length === 3) {
                throw new Error('Found a source and line, but no column');
              }

              cachedSegments[str] = segment;
            }

            // Generated column.
            mapping.generatedColumn = previousGeneratedColumn + segment[0];
            previousGeneratedColumn = mapping.generatedColumn;

            if (segment.length > 1) {
              // Original source.
              mapping.source = previousSource + segment[1];
              previousSource += segment[1];

              // Original line.
              mapping.originalLine = previousOriginalLine + segment[2];
              previousOriginalLine = mapping.originalLine;
              // Lines are stored 0-based
              mapping.originalLine += 1;

              // Original column.
              mapping.originalColumn = previousOriginalColumn + segment[3];
              previousOriginalColumn = mapping.originalColumn;

              if (segment.length > 4) {
                // Original name.
                mapping.name = previousName + segment[4];
                previousName += segment[4];
              }
            }

            generatedMappings.push(mapping);
            if (typeof mapping.originalLine === 'number') {
              originalMappings.push(mapping);
            }
          }
        }

        quickSort$1(generatedMappings, util.compareByGeneratedPositionsDeflated);
        this.__generatedMappings = generatedMappings;

        quickSort$1(originalMappings, util.compareByOriginalPositions);
        this.__originalMappings = originalMappings;
      };

    /**
     * Find the mapping that best matches the hypothetical "needle" mapping that
     * we are searching for in the given "haystack" of mappings.
     */
    BasicSourceMapConsumer.prototype._findMapping =
      function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
                                             aColumnName, aComparator, aBias) {
        // To return the position we are searching for, we must first find the
        // mapping for the given position and then return the opposite position it
        // points to. Because the mappings are sorted, we can use binary search to
        // find the best mapping.

        if (aNeedle[aLineName] <= 0) {
          throw new TypeError('Line must be greater than or equal to 1, got '
                              + aNeedle[aLineName]);
        }
        if (aNeedle[aColumnName] < 0) {
          throw new TypeError('Column must be greater than or equal to 0, got '
                              + aNeedle[aColumnName]);
        }

        return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
      };

    /**
     * Compute the last column for each generated mapping. The last column is
     * inclusive.
     */
    BasicSourceMapConsumer.prototype.computeColumnSpans =
      function SourceMapConsumer_computeColumnSpans() {
        for (var index = 0; index < this._generatedMappings.length; ++index) {
          var mapping = this._generatedMappings[index];

          // Mappings do not contain a field for the last generated columnt. We
          // can come up with an optimistic estimate, however, by assuming that
          // mappings are contiguous (i.e. given two consecutive mappings, the
          // first mapping ends where the second one starts).
          if (index + 1 < this._generatedMappings.length) {
            var nextMapping = this._generatedMappings[index + 1];

            if (mapping.generatedLine === nextMapping.generatedLine) {
              mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
              continue;
            }
          }

          // The last mapping for each line spans the entire line.
          mapping.lastGeneratedColumn = Infinity;
        }
      };

    /**
     * Returns the original source, line, and column information for the generated
     * source's line and column positions provided. The only argument is an object
     * with the following properties:
     *
     *   - line: The line number in the generated source.
     *   - column: The column number in the generated source.
     *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
     *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
     *     closest element that is smaller than or greater than the one we are
     *     searching for, respectively, if the exact element cannot be found.
     *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
     *
     * and an object is returned with the following properties:
     *
     *   - source: The original source file, or null.
     *   - line: The line number in the original source, or null.
     *   - column: The column number in the original source, or null.
     *   - name: The original identifier, or null.
     */
    BasicSourceMapConsumer.prototype.originalPositionFor =
      function SourceMapConsumer_originalPositionFor(aArgs) {
        var needle = {
          generatedLine: util.getArg(aArgs, 'line'),
          generatedColumn: util.getArg(aArgs, 'column')
        };

        var index = this._findMapping(
          needle,
          this._generatedMappings,
          "generatedLine",
          "generatedColumn",
          util.compareByGeneratedPositionsDeflated,
          util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
        );

        if (index >= 0) {
          var mapping = this._generatedMappings[index];

          if (mapping.generatedLine === needle.generatedLine) {
            var source = util.getArg(mapping, 'source', null);
            if (source !== null) {
              source = this._sources.at(source);
              if (this.sourceRoot != null) {
                source = util.join(this.sourceRoot, source);
              }
            }
            var name = util.getArg(mapping, 'name', null);
            if (name !== null) {
              name = this._names.at(name);
            }
            return {
              source: source,
              line: util.getArg(mapping, 'originalLine', null),
              column: util.getArg(mapping, 'originalColumn', null),
              name: name
            };
          }
        }

        return {
          source: null,
          line: null,
          column: null,
          name: null
        };
      };

    /**
     * Return true if we have the source content for every source in the source
     * map, false otherwise.
     */
    BasicSourceMapConsumer.prototype.hasContentsOfAllSources =
      function BasicSourceMapConsumer_hasContentsOfAllSources() {
        if (!this.sourcesContent) {
          return false;
        }
        return this.sourcesContent.length >= this._sources.size() &&
          !this.sourcesContent.some(function (sc) { return sc == null; });
      };

    /**
     * Returns the original source content. The only argument is the url of the
     * original source file. Returns null if no original source content is
     * available.
     */
    BasicSourceMapConsumer.prototype.sourceContentFor =
      function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
        if (!this.sourcesContent) {
          return null;
        }

        if (this.sourceRoot != null) {
          aSource = util.relative(this.sourceRoot, aSource);
        }

        if (this._sources.has(aSource)) {
          return this.sourcesContent[this._sources.indexOf(aSource)];
        }

        var url;
        if (this.sourceRoot != null
            && (url = util.urlParse(this.sourceRoot))) {
          // XXX: file:// URIs and absolute paths lead to unexpected behavior for
          // many users. We can help them out when they expect file:// URIs to
          // behave like it would if they were running a local HTTP server. See
          // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
          var fileUriAbsPath = aSource.replace(/^file:\/\//, "");
          if (url.scheme == "file"
              && this._sources.has(fileUriAbsPath)) {
            return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]
          }

          if ((!url.path || url.path == "/")
              && this._sources.has("/" + aSource)) {
            return this.sourcesContent[this._sources.indexOf("/" + aSource)];
          }
        }

        // This function is used recursively from
        // IndexedSourceMapConsumer.prototype.sourceContentFor. In that case, we
        // don't want to throw if we can't find the source - we just want to
        // return null, so we provide a flag to exit gracefully.
        if (nullOnMissing) {
          return null;
        }
        else {
          throw new Error('"' + aSource + '" is not in the SourceMap.');
        }
      };

    /**
     * Returns the generated line and column information for the original source,
     * line, and column positions provided. The only argument is an object with
     * the following properties:
     *
     *   - source: The filename of the original source.
     *   - line: The line number in the original source.
     *   - column: The column number in the original source.
     *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
     *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
     *     closest element that is smaller than or greater than the one we are
     *     searching for, respectively, if the exact element cannot be found.
     *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
     *
     * and an object is returned with the following properties:
     *
     *   - line: The line number in the generated source, or null.
     *   - column: The column number in the generated source, or null.
     */
    BasicSourceMapConsumer.prototype.generatedPositionFor =
      function SourceMapConsumer_generatedPositionFor(aArgs) {
        var source = util.getArg(aArgs, 'source');
        if (this.sourceRoot != null) {
          source = util.relative(this.sourceRoot, source);
        }
        if (!this._sources.has(source)) {
          return {
            line: null,
            column: null,
            lastColumn: null
          };
        }
        source = this._sources.indexOf(source);

        var needle = {
          source: source,
          originalLine: util.getArg(aArgs, 'line'),
          originalColumn: util.getArg(aArgs, 'column')
        };

        var index = this._findMapping(
          needle,
          this._originalMappings,
          "originalLine",
          "originalColumn",
          util.compareByOriginalPositions,
          util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
        );

        if (index >= 0) {
          var mapping = this._originalMappings[index];

          if (mapping.source === needle.source) {
            return {
              line: util.getArg(mapping, 'generatedLine', null),
              column: util.getArg(mapping, 'generatedColumn', null),
              lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
            };
          }
        }

        return {
          line: null,
          column: null,
          lastColumn: null
        };
      };

    var BasicSourceMapConsumer_1 = BasicSourceMapConsumer;

    /**
     * An IndexedSourceMapConsumer instance represents a parsed source map which
     * we can query for information. It differs from BasicSourceMapConsumer in
     * that it takes "indexed" source maps (i.e. ones with a "sections" field) as
     * input.
     *
     * The only parameter is a raw source map (either as a JSON string, or already
     * parsed to an object). According to the spec for indexed source maps, they
     * have the following attributes:
     *
     *   - version: Which version of the source map spec this map is following.
     *   - file: Optional. The generated file this source map is associated with.
     *   - sections: A list of section definitions.
     *
     * Each value under the "sections" field has two fields:
     *   - offset: The offset into the original specified at which this section
     *       begins to apply, defined as an object with a "line" and "column"
     *       field.
     *   - map: A source map definition. This source map could also be indexed,
     *       but doesn't have to be.
     *
     * Instead of the "map" field, it's also possible to have a "url" field
     * specifying a URL to retrieve a source map from, but that's currently
     * unsupported.
     *
     * Here's an example source map, taken from the source map spec[0], but
     * modified to omit a section which uses the "url" field.
     *
     *  {
     *    version : 3,
     *    file: "app.js",
     *    sections: [{
     *      offset: {line:100, column:10},
     *      map: {
     *        version : 3,
     *        file: "section.js",
     *        sources: ["foo.js", "bar.js"],
     *        names: ["src", "maps", "are", "fun"],
     *        mappings: "AAAA,E;;ABCDE;"
     *      }
     *    }],
     *  }
     *
     * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.535es3xeprgt
     */
    function IndexedSourceMapConsumer(aSourceMap) {
      var sourceMap = aSourceMap;
      if (typeof aSourceMap === 'string') {
        sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
      }

      var version = util.getArg(sourceMap, 'version');
      var sections = util.getArg(sourceMap, 'sections');

      if (version != this._version) {
        throw new Error('Unsupported version: ' + version);
      }

      this._sources = new ArraySet$1();
      this._names = new ArraySet$1();

      var lastOffset = {
        line: -1,
        column: 0
      };
      this._sections = sections.map(function (s) {
        if (s.url) {
          // The url field will require support for asynchronicity.
          // See https://github.com/mozilla/source-map/issues/16
          throw new Error('Support for url field in sections not implemented.');
        }
        var offset = util.getArg(s, 'offset');
        var offsetLine = util.getArg(offset, 'line');
        var offsetColumn = util.getArg(offset, 'column');

        if (offsetLine < lastOffset.line ||
            (offsetLine === lastOffset.line && offsetColumn < lastOffset.column)) {
          throw new Error('Section offsets must be ordered and non-overlapping.');
        }
        lastOffset = offset;

        return {
          generatedOffset: {
            // The offset fields are 0-based, but we use 1-based indices when
            // encoding/decoding from VLQ.
            generatedLine: offsetLine + 1,
            generatedColumn: offsetColumn + 1
          },
          consumer: new SourceMapConsumer(util.getArg(s, 'map'))
        }
      });
    }

    IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
    IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer;

    /**
     * The version of the source mapping spec that we are consuming.
     */
    IndexedSourceMapConsumer.prototype._version = 3;

    /**
     * The list of original sources.
     */
    Object.defineProperty(IndexedSourceMapConsumer.prototype, 'sources', {
      get: function () {
        var sources = [];
        for (var i = 0; i < this._sections.length; i++) {
          for (var j = 0; j < this._sections[i].consumer.sources.length; j++) {
            sources.push(this._sections[i].consumer.sources[j]);
          }
        }
        return sources;
      }
    });

    /**
     * Returns the original source, line, and column information for the generated
     * source's line and column positions provided. The only argument is an object
     * with the following properties:
     *
     *   - line: The line number in the generated source.
     *   - column: The column number in the generated source.
     *
     * and an object is returned with the following properties:
     *
     *   - source: The original source file, or null.
     *   - line: The line number in the original source, or null.
     *   - column: The column number in the original source, or null.
     *   - name: The original identifier, or null.
     */
    IndexedSourceMapConsumer.prototype.originalPositionFor =
      function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
        var needle = {
          generatedLine: util.getArg(aArgs, 'line'),
          generatedColumn: util.getArg(aArgs, 'column')
        };

        // Find the section containing the generated position we're trying to map
        // to an original position.
        var sectionIndex = binarySearch.search(needle, this._sections,
          function(needle, section) {
            var cmp = needle.generatedLine - section.generatedOffset.generatedLine;
            if (cmp) {
              return cmp;
            }

            return (needle.generatedColumn -
                    section.generatedOffset.generatedColumn);
          });
        var section = this._sections[sectionIndex];

        if (!section) {
          return {
            source: null,
            line: null,
            column: null,
            name: null
          };
        }

        return section.consumer.originalPositionFor({
          line: needle.generatedLine -
            (section.generatedOffset.generatedLine - 1),
          column: needle.generatedColumn -
            (section.generatedOffset.generatedLine === needle.generatedLine
             ? section.generatedOffset.generatedColumn - 1
             : 0),
          bias: aArgs.bias
        });
      };

    /**
     * Return true if we have the source content for every source in the source
     * map, false otherwise.
     */
    IndexedSourceMapConsumer.prototype.hasContentsOfAllSources =
      function IndexedSourceMapConsumer_hasContentsOfAllSources() {
        return this._sections.every(function (s) {
          return s.consumer.hasContentsOfAllSources();
        });
      };

    /**
     * Returns the original source content. The only argument is the url of the
     * original source file. Returns null if no original source content is
     * available.
     */
    IndexedSourceMapConsumer.prototype.sourceContentFor =
      function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
        for (var i = 0; i < this._sections.length; i++) {
          var section = this._sections[i];

          var content = section.consumer.sourceContentFor(aSource, true);
          if (content) {
            return content;
          }
        }
        if (nullOnMissing) {
          return null;
        }
        else {
          throw new Error('"' + aSource + '" is not in the SourceMap.');
        }
      };

    /**
     * Returns the generated line and column information for the original source,
     * line, and column positions provided. The only argument is an object with
     * the following properties:
     *
     *   - source: The filename of the original source.
     *   - line: The line number in the original source.
     *   - column: The column number in the original source.
     *
     * and an object is returned with the following properties:
     *
     *   - line: The line number in the generated source, or null.
     *   - column: The column number in the generated source, or null.
     */
    IndexedSourceMapConsumer.prototype.generatedPositionFor =
      function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
        for (var i = 0; i < this._sections.length; i++) {
          var section = this._sections[i];

          // Only consider this section if the requested source is in the list of
          // sources of the consumer.
          if (section.consumer.sources.indexOf(util.getArg(aArgs, 'source')) === -1) {
            continue;
          }
          var generatedPosition = section.consumer.generatedPositionFor(aArgs);
          if (generatedPosition) {
            var ret = {
              line: generatedPosition.line +
                (section.generatedOffset.generatedLine - 1),
              column: generatedPosition.column +
                (section.generatedOffset.generatedLine === generatedPosition.line
                 ? section.generatedOffset.generatedColumn - 1
                 : 0)
            };
            return ret;
          }
        }

        return {
          line: null,
          column: null
        };
      };

    /**
     * Parse the mappings in a string in to a data structure which we can easily
     * query (the ordered arrays in the `this.__generatedMappings` and
     * `this.__originalMappings` properties).
     */
    IndexedSourceMapConsumer.prototype._parseMappings =
      function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
        this.__generatedMappings = [];
        this.__originalMappings = [];
        for (var i = 0; i < this._sections.length; i++) {
          var section = this._sections[i];
          var sectionMappings = section.consumer._generatedMappings;
          for (var j = 0; j < sectionMappings.length; j++) {
            var mapping = sectionMappings[j];

            var source = section.consumer._sources.at(mapping.source);
            if (section.consumer.sourceRoot !== null) {
              source = util.join(section.consumer.sourceRoot, source);
            }
            this._sources.add(source);
            source = this._sources.indexOf(source);

            var name = section.consumer._names.at(mapping.name);
            this._names.add(name);
            name = this._names.indexOf(name);

            // The mappings coming from the consumer for the section have
            // generated positions relative to the start of the section, so we
            // need to offset them to be relative to the start of the concatenated
            // generated file.
            var adjustedMapping = {
              source: source,
              generatedLine: mapping.generatedLine +
                (section.generatedOffset.generatedLine - 1),
              generatedColumn: mapping.generatedColumn +
                (section.generatedOffset.generatedLine === mapping.generatedLine
                ? section.generatedOffset.generatedColumn - 1
                : 0),
              originalLine: mapping.originalLine,
              originalColumn: mapping.originalColumn,
              name: name
            };

            this.__generatedMappings.push(adjustedMapping);
            if (typeof adjustedMapping.originalLine === 'number') {
              this.__originalMappings.push(adjustedMapping);
            }
          }
        }

        quickSort$1(this.__generatedMappings, util.compareByGeneratedPositionsDeflated);
        quickSort$1(this.__originalMappings, util.compareByOriginalPositions);
      };

    var IndexedSourceMapConsumer_1 = IndexedSourceMapConsumer;

    var sourceMapConsumer = {
    	SourceMapConsumer: SourceMapConsumer_1,
    	BasicSourceMapConsumer: BasicSourceMapConsumer_1,
    	IndexedSourceMapConsumer: IndexedSourceMapConsumer_1
    };

    var stacktraceGps = createCommonjsModule(function (module, exports) {
    (function(root, factory) {
        // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

        /* istanbul ignore next */
        {
            module.exports = factory(sourceMapConsumer, stackframe);
        }
    }(commonjsGlobal, function(SourceMap, StackFrame) {

        /**
         * Make a X-Domain request to url and callback.
         *
         * @param {String} url
         * @returns {Promise} with response text if fulfilled
         */
        function _xdr(url) {
            return new Promise(function(resolve, reject) {
                var req = new XMLHttpRequest();
                req.open('get', url);
                req.onerror = reject;
                req.onreadystatechange = function onreadystatechange() {
                    if (req.readyState === 4) {
                        if (req.status >= 200 && req.status < 300) {
                            resolve(req.responseText);
                        } else {
                            reject(new Error('HTTP status: ' + req.status + ' retrieving ' + url));
                        }
                    }
                };
                req.send();
            });

        }

        /**
         * Convert a Base64-encoded string into its original representation.
         * Used for inline sourcemaps.
         *
         * @param {String} b64str Base-64 encoded string
         * @returns {String} original representation of the base64-encoded string.
         */
        function _atob(b64str) {
            if (typeof window !== 'undefined' && window.atob) {
                return window.atob(b64str);
            } else {
                throw new Error('You must supply a polyfill for window.atob in this environment');
            }
        }

        function _parseJson(string) {
            if (typeof JSON !== 'undefined' && JSON.parse) {
                return JSON.parse(string);
            } else {
                throw new Error('You must supply a polyfill for JSON.parse in this environment');
            }
        }

        function _findFunctionName(source, lineNumber/*, columnNumber*/) {
            // function {name}({args}) m[1]=name m[2]=args
            var reFunctionDeclaration = /function\s+([^(]*?)\s*\(([^)]*)\)/;
            // {name} = function ({args}) TODO args capture
            var reFunctionExpression = /['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*function\b/;
            // {name} = eval()
            var reFunctionEvaluation = /['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*(?:eval|new Function)\b/;
            var lines = source.split('\n');

            // Walk backwards in the source lines until we find the line which matches one of the patterns above
            var code = '';
            var maxLines = Math.min(lineNumber, 20);
            var m;
            for (var i = 0; i < maxLines; ++i) {
                // lineNo is 1-based, source[] is 0-based
                var line = lines[lineNumber - i - 1];
                var commentPos = line.indexOf('//');
                if (commentPos >= 0) {
                    line = line.substr(0, commentPos);
                }

                if (line) {
                    code = line + code;
                    m = reFunctionExpression.exec(code);
                    if (m && m[1]) {
                        return m[1];
                    }
                    m = reFunctionDeclaration.exec(code);
                    if (m && m[1]) {
                        return m[1];
                    }
                    m = reFunctionEvaluation.exec(code);
                    if (m && m[1]) {
                        return m[1];
                    }
                }
            }
            return undefined;
        }

        function _ensureSupportedEnvironment() {
            if (typeof Object.defineProperty !== 'function' || typeof Object.create !== 'function') {
                throw new Error('Unable to consume source maps in older browsers');
            }
        }

        function _ensureStackFrameIsLegit(stackframe) {
            if (typeof stackframe !== 'object') {
                throw new TypeError('Given StackFrame is not an object');
            } else if (typeof stackframe.fileName !== 'string') {
                throw new TypeError('Given file name is not a String');
            } else if (typeof stackframe.lineNumber !== 'number' ||
                stackframe.lineNumber % 1 !== 0 ||
                stackframe.lineNumber < 1) {
                throw new TypeError('Given line number must be a positive integer');
            } else if (typeof stackframe.columnNumber !== 'number' ||
                stackframe.columnNumber % 1 !== 0 ||
                stackframe.columnNumber < 0) {
                throw new TypeError('Given column number must be a non-negative integer');
            }
            return true;
        }

        function _findSourceMappingURL(source) {
            var m = /\/\/[#@] ?sourceMappingURL=([^\s'"]+)\s*$/.exec(source);
            if (m && m[1]) {
                return m[1];
            } else {
                throw new Error('sourceMappingURL not found');
            }
        }

        function _extractLocationInfoFromSourceMap(stackframe, rawSourceMap, sourceCache) {
            return new Promise(function(resolve, reject) {
                var mapConsumer = new SourceMap.SourceMapConsumer(rawSourceMap);

                var loc = mapConsumer.originalPositionFor({
                    line: stackframe.lineNumber,
                    column: stackframe.columnNumber
                });

                if (loc.source) {
                    var mappedSource = mapConsumer.sourceContentFor(loc.source);
                    if (mappedSource) {
                        sourceCache[loc.source] = mappedSource;
                    }
                    resolve(
                        new StackFrame(
                            loc.name || stackframe.functionName,
                            stackframe.args,
                            loc.source,
                            loc.line,
                            loc.column));
                } else {
                    reject(new Error('Could not get original source for given stackframe and source map'));
                }
            });
        }

        /**
         * @constructor
         * @param {Object} opts
         *      opts.sourceCache = {url: "Source String"} => preload source cache
         *      opts.offline = True to prevent network requests.
         *              Best effort without sources or source maps.
         *      opts.ajax = Promise returning function to make X-Domain requests
         */
        return function StackTraceGPS(opts) {
            if (!(this instanceof StackTraceGPS)) {
                return new StackTraceGPS(opts);
            }
            opts = opts || {};

            this.sourceCache = opts.sourceCache || {};

            this.ajax = opts.ajax || _xdr;

            this._atob = opts.atob || _atob;

            this._get = function _get(location) {
                return new Promise(function(resolve, reject) {
                    var isDataUrl = location.substr(0, 5) === 'data:';
                    if (this.sourceCache[location]) {
                        resolve(this.sourceCache[location]);
                    } else if (opts.offline && !isDataUrl) {
                        reject(new Error('Cannot make network requests in offline mode'));
                    } else {
                        if (isDataUrl) {
                            // data URLs can have parameters.
                            // see http://tools.ietf.org/html/rfc2397
                            var supportedEncodingRegexp =
                                /^data:application\/json;([\w=:"-]+;)*base64,/;
                            var match = location.match(supportedEncodingRegexp);
                            if (match) {
                                var sourceMapStart = match[0].length;
                                var encodedSource = location.substr(sourceMapStart);
                                var source = this._atob(encodedSource);
                                this.sourceCache[location] = source;
                                resolve(source);
                            } else {
                                reject(new Error('The encoding of the inline sourcemap is not supported'));
                            }
                        } else {
                            var xhrPromise = this.ajax(location, {method: 'get'});
                            // Cache the Promise to prevent duplicate in-flight requests
                            this.sourceCache[location] = xhrPromise;
                            xhrPromise.then(resolve, reject);
                        }
                    }
                }.bind(this));
            };

            /**
             * Given a StackFrame, enhance function name and use source maps for a
             * better StackFrame.
             *
             * @param {StackFrame} stackframe object
             * @returns {Promise} that resolves with with source-mapped StackFrame
             */
            this.pinpoint = function StackTraceGPS$$pinpoint(stackframe) {
                return new Promise(function(resolve, reject) {
                    this.getMappedLocation(stackframe).then(function(mappedStackFrame) {
                        function resolveMappedStackFrame() {
                            resolve(mappedStackFrame);
                        }

                        this.findFunctionName(mappedStackFrame)
                            .then(resolve, resolveMappedStackFrame)
                            ['catch'](resolveMappedStackFrame);
                    }.bind(this), reject);
                }.bind(this));
            };

            /**
             * Given a StackFrame, guess function name from location information.
             *
             * @param {StackFrame} stackframe
             * @returns {Promise} that resolves with enhanced StackFrame.
             */
            this.findFunctionName = function StackTraceGPS$$findFunctionName(stackframe) {
                return new Promise(function(resolve, reject) {
                    _ensureStackFrameIsLegit(stackframe);
                    this._get(stackframe.fileName).then(function getSourceCallback(source) {
                        var lineNumber = stackframe.lineNumber;
                        var columnNumber = stackframe.columnNumber;
                        var guessedFunctionName = _findFunctionName(source, lineNumber);
                        // Only replace functionName if we found something
                        if (guessedFunctionName) {
                            resolve(new StackFrame(guessedFunctionName,
                                stackframe.args,
                                stackframe.fileName,
                                lineNumber,
                                columnNumber));
                        } else {
                            resolve(stackframe);
                        }
                    }, reject)['catch'](reject);
                }.bind(this));
            };

            /**
             * Given a StackFrame, seek source-mapped location and return new enhanced StackFrame.
             *
             * @param {StackFrame} stackframe
             * @returns {Promise} that resolves with enhanced StackFrame.
             */
            this.getMappedLocation = function StackTraceGPS$$getMappedLocation(stackframe) {
                return new Promise(function(resolve, reject) {
                    _ensureSupportedEnvironment();
                    _ensureStackFrameIsLegit(stackframe);

                    var sourceCache = this.sourceCache;
                    var fileName = stackframe.fileName;
                    this._get(fileName).then(function(source) {
                        var sourceMappingURL = _findSourceMappingURL(source);
                        var isDataUrl = sourceMappingURL.substr(0, 5) === 'data:';
                        var base = fileName.substring(0, fileName.lastIndexOf('/') + 1);

                        if (sourceMappingURL[0] !== '/' && !isDataUrl && !(/^https?:\/\/|^\/\//i).test(sourceMappingURL)) {
                            sourceMappingURL = base + sourceMappingURL;
                        }

                        this._get(sourceMappingURL).then(function(sourceMap) {
                            if (typeof sourceMap === 'string') {
                                sourceMap = _parseJson(sourceMap.replace(/^\)\]\}'/, ''));
                            }
                            if (typeof sourceMap.sourceRoot === 'undefined') {
                                sourceMap.sourceRoot = base;
                            }

                            _extractLocationInfoFromSourceMap(stackframe, sourceMap, sourceCache)
                                .then(resolve)['catch'](function() {
                                resolve(stackframe);
                            });
                        }, reject)['catch'](reject);
                    }.bind(this), reject)['catch'](reject);
                }.bind(this));
            };
        };
    }));
    });

    var stacktrace = createCommonjsModule(function (module, exports) {
    (function(root, factory) {
        // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

        /* istanbul ignore next */
        {
            module.exports = factory(errorStackParser, stackGenerator, stacktraceGps);
        }
    }(commonjsGlobal, function StackTrace(ErrorStackParser, StackGenerator, StackTraceGPS) {
        var _options = {
            filter: function(stackframe) {
                // Filter out stackframes for this library by default
                return (stackframe.functionName || '').indexOf('StackTrace$$') === -1 &&
                    (stackframe.functionName || '').indexOf('ErrorStackParser$$') === -1 &&
                    (stackframe.functionName || '').indexOf('StackTraceGPS$$') === -1 &&
                    (stackframe.functionName || '').indexOf('StackGenerator$$') === -1;
            },
            sourceCache: {}
        };

        var _generateError = function StackTrace$$GenerateError() {
            try {
                // Error must be thrown to get stack in IE
                throw new Error();
            } catch (err) {
                return err;
            }
        };

        /**
         * Merge 2 given Objects. If a conflict occurs the second object wins.
         * Does not do deep merges.
         *
         * @param {Object} first base object
         * @param {Object} second overrides
         * @returns {Object} merged first and second
         * @private
         */
        function _merge(first, second) {
            var target = {};

            [first, second].forEach(function(obj) {
                for (var prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        target[prop] = obj[prop];
                    }
                }
                return target;
            });

            return target;
        }

        function _isShapedLikeParsableError(err) {
            return err.stack || err['opera#sourceloc'];
        }

        function _filtered(stackframes, filter) {
            if (typeof filter === 'function') {
                return stackframes.filter(filter);
            }
            return stackframes;
        }

        return {
            /**
             * Get a backtrace from invocation point.
             *
             * @param {Object} opts
             * @returns {Array} of StackFrame
             */
            get: function StackTrace$$get(opts) {
                var err = _generateError();
                return _isShapedLikeParsableError(err) ? this.fromError(err, opts) : this.generateArtificially(opts);
            },

            /**
             * Get a backtrace from invocation point.
             * IMPORTANT: Does not handle source maps or guess function names!
             *
             * @param {Object} opts
             * @returns {Array} of StackFrame
             */
            getSync: function StackTrace$$getSync(opts) {
                opts = _merge(_options, opts);
                var err = _generateError();
                var stack = _isShapedLikeParsableError(err) ? ErrorStackParser.parse(err) : StackGenerator.backtrace(opts);
                return _filtered(stack, opts.filter);
            },

            /**
             * Given an error object, parse it.
             *
             * @param {Error} error object
             * @param {Object} opts
             * @returns {Promise} for Array[StackFrame}
             */
            fromError: function StackTrace$$fromError(error, opts) {
                opts = _merge(_options, opts);
                var gps = new StackTraceGPS(opts);
                return new Promise(function(resolve) {
                    var stackframes = _filtered(ErrorStackParser.parse(error), opts.filter);
                    resolve(Promise.all(stackframes.map(function(sf) {
                        return new Promise(function(resolve) {
                            function resolveOriginal() {
                                resolve(sf);
                            }

                            gps.pinpoint(sf).then(resolve, resolveOriginal)['catch'](resolveOriginal);
                        });
                    })));
                }.bind(this));
            },

            /**
             * Use StackGenerator to generate a backtrace.
             *
             * @param {Object} opts
             * @returns {Promise} of Array[StackFrame]
             */
            generateArtificially: function StackTrace$$generateArtificially(opts) {
                opts = _merge(_options, opts);
                var stackFrames = StackGenerator.backtrace(opts);
                if (typeof opts.filter === 'function') {
                    stackFrames = stackFrames.filter(opts.filter);
                }
                return Promise.resolve(stackFrames);
            },

            /**
             * Given a function, wrap it such that invocations trigger a callback that
             * is called with a stack trace.
             *
             * @param {Function} fn to be instrumented
             * @param {Function} callback function to call with a stack trace on invocation
             * @param {Function} errback optional function to call with error if unable to get stack trace.
             * @param {Object} thisArg optional context object (e.g. window)
             */
            instrument: function StackTrace$$instrument(fn, callback, errback, thisArg) {
                if (typeof fn !== 'function') {
                    throw new Error('Cannot instrument non-function object');
                } else if (typeof fn.__stacktraceOriginalFn === 'function') {
                    // Already instrumented, return given Function
                    return fn;
                }

                var instrumented = function StackTrace$$instrumented() {
                    try {
                        this.get().then(callback, errback)['catch'](errback);
                        return fn.apply(thisArg || this, arguments);
                    } catch (e) {
                        if (_isShapedLikeParsableError(e)) {
                            this.fromError(e).then(callback, errback)['catch'](errback);
                        }
                        throw e;
                    }
                }.bind(this);
                instrumented.__stacktraceOriginalFn = fn;

                return instrumented;
            },

            /**
             * Given a function that has been instrumented,
             * revert the function to it's original (non-instrumented) state.
             *
             * @param {Function} fn to de-instrument
             */
            deinstrument: function StackTrace$$deinstrument(fn) {
                if (typeof fn !== 'function') {
                    throw new Error('Cannot de-instrument non-function object');
                } else if (typeof fn.__stacktraceOriginalFn === 'function') {
                    return fn.__stacktraceOriginalFn;
                } else {
                    // Function not instrumented, return original
                    return fn;
                }
            },

            /**
             * Given an error message and Array of StackFrames, serialize and POST to given URL.
             *
             * @param {Array} stackframes
             * @param {String} url
             * @param {String} errorMsg
             */
            report: function StackTrace$$report(stackframes, url, errorMsg) {
                return new Promise(function(resolve, reject) {
                    var req = new XMLHttpRequest();
                    req.onerror = reject;
                    req.onreadystatechange = function onreadystatechange() {
                        if (req.readyState === 4) {
                            if (req.status >= 200 && req.status < 400) {
                                resolve(req.responseText);
                            } else {
                                reject(new Error('POST to ' + url + ' failed with status: ' + req.status));
                            }
                        }
                    };
                    req.open('post', url);
                    req.setRequestHeader('Content-Type', 'application/json');

                    var reportPayload = {stack: stackframes};
                    if (errorMsg !== undefined) {
                        reportPayload.message = errorMsg;
                    }

                    req.send(JSON.stringify(reportPayload));
                });
            }
        };
    }));
    });

    /**
     * Some utilities to format messages.
     */
    var MessageFormatUtils = (function () {
        function MessageFormatUtils() {
        }
        /**
         * Render given date in given DateFormat and return as String.
         * @param date Date
         * @param dateFormat Format
         * @returns {string} Formatted date
         */
        MessageFormatUtils.renderDate = function (date, dateFormat) {
            var lpad = function (value, chars, padWith) {
                var howMany = chars - value.length;
                if (howMany > 0) {
                    var res = "";
                    for (var i = 0; i < howMany; i++) {
                        res += padWith;
                    }
                    res += value;
                    return res;
                }
                return value;
            };
            var fullYear = function (d) {
                return lpad(d.getFullYear().toString(), 4, "0");
            };
            var month = function (d) {
                return lpad((d.getMonth() + 1).toString(), 2, "0");
            };
            var day = function (d) {
                return lpad(d.getDate().toString(), 2, "0");
            };
            var hours = function (d) {
                return lpad(d.getHours().toString(), 2, "0");
            };
            var minutes = function (d) {
                return lpad(d.getMinutes().toString(), 2, "0");
            };
            var seconds = function (d) {
                return lpad(d.getSeconds().toString(), 2, "0");
            };
            var millis = function (d) {
                return lpad(d.getMilliseconds().toString(), 3, "0");
            };
            var dateSeparator = dateFormat.dateSeparator;
            var ds = "";
            switch (dateFormat.formatEnum) {
                case LoggerOptions.DateFormatEnum.Default:
                    // yyyy-mm-dd hh:mm:ss,m
                    ds = fullYear(date) + dateSeparator + month(date) + dateSeparator + day(date) + " " +
                        hours(date) + ":" + minutes(date) + ":" + seconds(date) + "," + millis(date);
                    break;
                case LoggerOptions.DateFormatEnum.YearMonthDayTime:
                    ds = fullYear(date) + dateSeparator + month(date) + dateSeparator + day(date) + " " +
                        hours(date) + ":" + minutes(date) + ":" + seconds(date);
                    break;
                case LoggerOptions.DateFormatEnum.YearDayMonthWithFullTime:
                    ds = fullYear(date) + dateSeparator + day(date) + dateSeparator + month(date) + " " +
                        hours(date) + ":" + minutes(date) + ":" + seconds(date) + "," + millis(date);
                    break;
                case LoggerOptions.DateFormatEnum.YearDayMonthTime:
                    ds = fullYear(date) + dateSeparator + day(date) + dateSeparator + month(date) + " " +
                        hours(date) + ":" + minutes(date) + ":" + seconds(date);
                    break;
                default:
                    throw new Error("Unsupported date format enum: " + dateFormat.formatEnum);
            }
            return ds;
        };
        /**
         * Renders given category log message in default format.
         * @param msg Message to format
         * @param addStack If true adds the stack to the output, otherwise skips it
         * @returns {string} Formatted message
         */
        MessageFormatUtils.renderDefaultMessage = function (msg, addStack) {
            var result = "";
            var logFormat = msg.logFormat;
            if (logFormat.showTimeStamp) {
                result += MessageFormatUtils.renderDate(msg.date, logFormat.dateFormat) + " ";
            }
            result += LoggerOptions.LogLevel[msg.level].toUpperCase();
            if (msg.isResolvedErrorMessage) {
                result += " (resolved)";
            }
            result += " ";
            if (logFormat.showCategoryName) {
                result += "[";
                msg.categories.forEach(function (value, idx) {
                    if (idx > 0) {
                        result += ", ";
                    }
                    result += value.name;
                });
                result += "]";
            }
            // Get the normal string message first
            var actualStringMsg = "";
            var dataString = "";
            var messageOrLogData = msg.message;
            if (typeof messageOrLogData === "string") {
                actualStringMsg = messageOrLogData;
            }
            else {
                var logData = messageOrLogData;
                actualStringMsg = logData.msg;
                // We do have data?
                if (logData.data) {
                    dataString = " [data]: " + (logData.ds ? logData.ds(logData.data) : JSON.stringify(logData.data));
                }
            }
            result += " " + actualStringMsg + "" + dataString;
            if (addStack && msg.errorAsStack !== null) {
                result += "\n" + msg.errorAsStack;
            }
            return result;
        };
        /**
         * Renders given log4j log message in default format.
         * @param msg Message to format
         * @param addStack If true adds the stack to the output, otherwise skips it
         * @returns {string} Formatted message
         */
        MessageFormatUtils.renderDefaultLog4jMessage = function (msg, addStack) {
            var format = msg.logGroupRule.logFormat;
            var result = "";
            if (format.showTimeStamp) {
                result += MessageFormatUtils.renderDate(msg.date, format.dateFormat) + " ";
            }
            result += LoggerOptions.LogLevel[msg.level].toUpperCase() + " ";
            if (format.showLoggerName) {
                result += "[" + msg.loggerName + "]";
            }
            // Get the normal string message first
            var actualStringMsg = "";
            var dataString = "";
            if (typeof msg.message === "string") {
                actualStringMsg = msg.message;
            }
            else {
                var logData = msg.message;
                actualStringMsg = logData.msg;
                // We do have data?
                if (logData.data) {
                    dataString = " [data]: " + (logData.ds ? logData.ds(logData.data) : JSON.stringify(logData.data));
                }
            }
            result += " " + actualStringMsg + "" + dataString;
            if (addStack && msg.errorAsStack !== null) {
                result += "\n" + msg.errorAsStack;
            }
            return result;
        };
        /**
         * Render error as stack
         * @param error Return error as Promise
         * @returns {Promise<string>|Promise} Promise for stack
         */
        MessageFormatUtils.renderError = function (error) {
            var result = error.name + ": " + error.message + "\n@";
            return new Promise(function (resolve) {
                // This one has a promise too
                stacktrace.fromError(error, { offline: true }).then(function (frames) {
                    var stackStr = (frames.map(function (frame) {
                        return frame.toString();
                    })).join("\n  ");
                    result += "\n" + stackStr;
                    // This resolves our returned promise
                    resolve(result);
                }).catch(function () {
                    result = "Unexpected error object was passed in. ";
                    try {
                        result += "Could not resolve it, stringified object: " + JSON.stringify(error);
                    }
                    catch (e) {
                        // Cannot stringify can only tell something was wrong.
                        result += "Could not resolve it or stringify it.";
                    }
                    resolve(result);
                });
            });
        };
        return MessageFormatUtils;
    }());
    var MessageFormatUtils_1 = MessageFormatUtils;


    var MessageUtils = /*#__PURE__*/Object.defineProperty({
    	MessageFormatUtils: MessageFormatUtils_1
    }, '__esModule', {value: true});

    var LogMessageInternalImpl = (function () {
        function LogMessageInternalImpl(loggerName, message, errorAsStack, error, logGroupRule, date, level, ready) {
            this._errorAsStack = null;
            this._error = null;
            this._loggerName = loggerName;
            this._message = message;
            this._errorAsStack = errorAsStack;
            this._error = error;
            this._logGroupRule = logGroupRule;
            this._date = date;
            this._level = level;
            this._ready = ready;
        }
        Object.defineProperty(LogMessageInternalImpl.prototype, "loggerName", {
            get: function () {
                return this._loggerName;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LogMessageInternalImpl.prototype, "message", {
            get: function () {
                return this._message;
            },
            set: function (value) {
                this._message = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LogMessageInternalImpl.prototype, "errorAsStack", {
            get: function () {
                return this._errorAsStack;
            },
            set: function (value) {
                this._errorAsStack = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LogMessageInternalImpl.prototype, "error", {
            get: function () {
                return this._error;
            },
            set: function (value) {
                this._error = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LogMessageInternalImpl.prototype, "logGroupRule", {
            get: function () {
                return this._logGroupRule;
            },
            set: function (value) {
                this._logGroupRule = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LogMessageInternalImpl.prototype, "date", {
            get: function () {
                return this._date;
            },
            set: function (value) {
                this._date = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LogMessageInternalImpl.prototype, "level", {
            get: function () {
                return this._level;
            },
            set: function (value) {
                this._level = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LogMessageInternalImpl.prototype, "isMessageLogData", {
            get: function () {
                return typeof (this._message) !== "string";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LogMessageInternalImpl.prototype, "ready", {
            get: function () {
                return this._ready;
            },
            set: function (value) {
                this._ready = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LogMessageInternalImpl.prototype, "messageAsString", {
            get: function () {
                if (typeof (this._message) === "string") {
                    return this._message;
                }
                return this._message.msg;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LogMessageInternalImpl.prototype, "logData", {
            get: function () {
                var result = null;
                if (typeof (this._message) !== "string") {
                    result = this.message;
                }
                return result;
            },
            enumerable: true,
            configurable: true
        });
        return LogMessageInternalImpl;
    }());
    /**
     * Abstract base logger, extend to easily implement a custom logger that
     * logs wherever you want. You only need to implement doLog(msg: LogMessage) and
     * log that somewhere (it will contain format and everything else).
     */
    var AbstractLogger = (function () {
        function AbstractLogger(name, logGroupRuntimeSettings) {
            this._allMessages = new DataStructures.LinkedList();
            this._open = true;
            this._name = name;
            this._logGroupRuntimeSettings = logGroupRuntimeSettings;
        }
        Object.defineProperty(AbstractLogger.prototype, "name", {
            get: function () {
                return this._name;
            },
            enumerable: true,
            configurable: true
        });
        AbstractLogger.prototype.trace = function (msg, error) {
            if (error === void 0) { error = null; }
            this._log(LoggerOptions.LogLevel.Trace, msg, error);
        };
        AbstractLogger.prototype.debug = function (msg, error) {
            if (error === void 0) { error = null; }
            this._log(LoggerOptions.LogLevel.Debug, msg, error);
        };
        AbstractLogger.prototype.info = function (msg, error) {
            if (error === void 0) { error = null; }
            this._log(LoggerOptions.LogLevel.Info, msg, error);
        };
        AbstractLogger.prototype.warn = function (msg, error) {
            if (error === void 0) { error = null; }
            this._log(LoggerOptions.LogLevel.Warn, msg, error);
        };
        AbstractLogger.prototype.error = function (msg, error) {
            if (error === void 0) { error = null; }
            this._log(LoggerOptions.LogLevel.Error, msg, error);
        };
        AbstractLogger.prototype.fatal = function (msg, error) {
            if (error === void 0) { error = null; }
            this._log(LoggerOptions.LogLevel.Fatal, msg, error);
        };
        AbstractLogger.prototype.isTraceEnabled = function () {
            return this._logGroupRuntimeSettings.level === LoggerOptions.LogLevel.Trace;
        };
        AbstractLogger.prototype.isDebugEnabled = function () {
            return this._logGroupRuntimeSettings.level <= LoggerOptions.LogLevel.Debug;
        };
        AbstractLogger.prototype.isInfoEnabled = function () {
            return this._logGroupRuntimeSettings.level <= LoggerOptions.LogLevel.Info;
        };
        AbstractLogger.prototype.isWarnEnabled = function () {
            return this._logGroupRuntimeSettings.level <= LoggerOptions.LogLevel.Warn;
        };
        AbstractLogger.prototype.isErrorEnabled = function () {
            return this._logGroupRuntimeSettings.level <= LoggerOptions.LogLevel.Error;
        };
        AbstractLogger.prototype.isFatalEnabled = function () {
            return this._logGroupRuntimeSettings.level <= LoggerOptions.LogLevel.Fatal;
        };
        AbstractLogger.prototype.getLogLevel = function () {
            return this._logGroupRuntimeSettings.level;
        };
        AbstractLogger.prototype.isOpen = function () {
            return this._open;
        };
        AbstractLogger.prototype.close = function () {
            this._open = false;
            this._allMessages.clear();
        };
        AbstractLogger.prototype.createDefaultLogMessage = function (msg) {
            return MessageUtils.MessageFormatUtils.renderDefaultLog4jMessage(msg, true);
        };
        /**
         * Return optional message formatter. All LoggerTypes (except custom) will see if
         * they have this, and if so use it to log.
         * @returns {((message:LogMessage)=>string)|null}
         */
        AbstractLogger.prototype._getMessageFormatter = function () {
            return this._logGroupRuntimeSettings.formatterLogMessage;
        };
        AbstractLogger.prototype._log = function (level, msg, error) {
            if (error === void 0) { error = null; }
            if (this._open && this._logGroupRuntimeSettings.level <= level) {
                var functionMessage = function () {
                    if (typeof msg === "function") {
                        return msg();
                    }
                    return msg;
                };
                var functionError = function () {
                    if (typeof error === "function") {
                        return error();
                    }
                    return error;
                };
                this._allMessages.addTail(this.createMessage(level, functionMessage, functionError, new Date()));
                this.processMessages();
            }
        };
        AbstractLogger.prototype.createMessage = function (level, msg, error, date) {
            var _this = this;
            var errorResult = error();
            if (errorResult !== null) {
                var message_1 = new LogMessageInternalImpl(this._name, msg(), null, errorResult, this._logGroupRuntimeSettings.logGroupRule, date, level, false);
                MessageUtils.MessageFormatUtils.renderError(errorResult).then(function (stack) {
                    message_1.errorAsStack = stack;
                    message_1.ready = true;
                    _this.processMessages();
                }).catch(function () {
                    message_1.errorAsStack = "<UNKNOWN> unable to get stack.";
                    message_1.ready = true;
                    _this.processMessages();
                });
                return message_1;
            }
            return new LogMessageInternalImpl(this._name, msg(), null, errorResult, this._logGroupRuntimeSettings.logGroupRule, date, level, true);
        };
        AbstractLogger.prototype.processMessages = function () {
            // Basically we wait until errors are resolved (those messages
            // may not be ready).
            var msgs = this._allMessages;
            if (msgs.getSize() > 0) {
                do {
                    var msg = msgs.getHead();
                    if (msg != null) {
                        if (!msg.ready) {
                            break;
                        }
                        msgs.removeHead();
                        // This can never be null normally, but strict null checking ...
                        if (msg.message !== null) {
                            this.doLog(msg);
                        }
                    }
                } while (msgs.getSize() > 0);
            }
        };
        return AbstractLogger;
    }());
    var AbstractLogger_2 = AbstractLogger;


    var AbstractLogger_1 = /*#__PURE__*/Object.defineProperty({
    	AbstractLogger: AbstractLogger_2
    }, '__esModule', {value: true});

    var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();



    /**
     * Simple logger, that logs to the console. If the console is unavailable will throw exception.
     */
    var ConsoleLoggerImpl = (function (_super) {
        __extends(ConsoleLoggerImpl, _super);
        function ConsoleLoggerImpl(name, logGroupRuntimeSettings) {
            return _super.call(this, name, logGroupRuntimeSettings) || this;
        }
        ConsoleLoggerImpl.prototype.doLog = function (message) {
            if (console !== undefined) {
                var logged = false;
                var logLevel = message.level;
                var messageFormatter = this._getMessageFormatter();
                var msg = void 0;
                if (messageFormatter === null) {
                    msg = this.createDefaultLogMessage(message);
                }
                else {
                    msg = messageFormatter(message);
                }
                /* tslint:disable:no-console */
                switch (logLevel) {
                    case LoggerOptions.LogLevel.Trace:
                        // Do not try trace we don't want a stack
                        break;
                    case LoggerOptions.LogLevel.Debug:
                        // Don't try, too much differences of consoles.
                        break;
                    case LoggerOptions.LogLevel.Info:
                        if (console.info) {
                            console.info(msg);
                            logged = true;
                        }
                        break;
                    case LoggerOptions.LogLevel.Warn:
                        if (console.warn) {
                            console.warn(msg);
                            logged = true;
                        }
                        break;
                    case LoggerOptions.LogLevel.Error:
                    case LoggerOptions.LogLevel.Fatal:
                        if (console.error) {
                            console.error(msg);
                            logged = true;
                        }
                        break;
                    default:
                        throw new Error("Log level not supported: " + logLevel);
                }
                if (!logged) {
                    console.log(msg);
                }
                /* tslint:enable:no-console */
            }
            else {
                throw new Error("Console is not defined, cannot log msg: " + message.message);
            }
        };
        return ConsoleLoggerImpl;
    }(AbstractLogger_1.AbstractLogger));
    var ConsoleLoggerImpl_2 = ConsoleLoggerImpl;


    var ConsoleLoggerImpl_1 = /*#__PURE__*/Object.defineProperty({
    	ConsoleLoggerImpl: ConsoleLoggerImpl_2
    }, '__esModule', {value: true});

    var __extends$1 = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();


    /**
     * Logger which buffers all messages, use with care due to possible high memory footprint.
     * Can be convenient in some cases. Call toString() for full output, or cast to this class
     * and call getMessages() to do something with it yourself.
     */
    var MessageBufferLoggerImpl = (function (_super) {
        __extends$1(MessageBufferLoggerImpl, _super);
        function MessageBufferLoggerImpl(name, logGroupRuntimeSettings) {
            var _this = _super.call(this, name, logGroupRuntimeSettings) || this;
            _this.messages = [];
            return _this;
        }
        MessageBufferLoggerImpl.prototype.close = function () {
            this.messages = [];
            _super.prototype.close.call(this);
        };
        MessageBufferLoggerImpl.prototype.getMessages = function () {
            return this.messages;
        };
        MessageBufferLoggerImpl.prototype.toString = function () {
            return this.messages.map(function (msg) {
                return msg;
            }).join("\n");
        };
        MessageBufferLoggerImpl.prototype.doLog = function (message) {
            var messageFormatter = this._getMessageFormatter();
            var fullMsg;
            if (messageFormatter === null) {
                fullMsg = this.createDefaultLogMessage(message);
            }
            else {
                fullMsg = messageFormatter(message);
            }
            this.messages.push(fullMsg);
        };
        return MessageBufferLoggerImpl;
    }(AbstractLogger_1.AbstractLogger));
    var MessageBufferLoggerImpl_2 = MessageBufferLoggerImpl;


    var MessageBufferLoggerImpl_1 = /*#__PURE__*/Object.defineProperty({
    	MessageBufferLoggerImpl: MessageBufferLoggerImpl_2
    }, '__esModule', {value: true});

    /**
     * Represents the runtime settings for a LogGroup (LogGroupRule).
     */
    var LogGroupRuntimeSettings = (function () {
        function LogGroupRuntimeSettings(logGroupRule) {
            this._formatterLogMessage = null;
            this._logGroupRule = logGroupRule;
            this._level = logGroupRule.level;
            this._loggerType = logGroupRule.loggerType;
            this._logFormat = new LoggerOptions.LogFormat(new LoggerOptions.DateFormat(logGroupRule.logFormat.dateFormat.formatEnum, logGroupRule.logFormat.dateFormat.dateSeparator), logGroupRule.logFormat.showTimeStamp, logGroupRule.logFormat.showLoggerName);
            this._callBackLogger = logGroupRule.callBackLogger;
            this._formatterLogMessage = logGroupRule.formatterLogMessage;
        }
        Object.defineProperty(LogGroupRuntimeSettings.prototype, "logGroupRule", {
            /**
             * Returns original LogGroupRule (so not runtime settings!)
             * @return {LogGroupRule}
             */
            get: function () {
                return this._logGroupRule;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LogGroupRuntimeSettings.prototype, "level", {
            get: function () {
                return this._level;
            },
            set: function (value) {
                this._level = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LogGroupRuntimeSettings.prototype, "loggerType", {
            get: function () {
                return this._loggerType;
            },
            set: function (value) {
                this._loggerType = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LogGroupRuntimeSettings.prototype, "logFormat", {
            get: function () {
                return this._logFormat;
            },
            set: function (value) {
                this._logFormat = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LogGroupRuntimeSettings.prototype, "callBackLogger", {
            get: function () {
                return this._callBackLogger;
            },
            set: function (value) {
                this._callBackLogger = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LogGroupRuntimeSettings.prototype, "formatterLogMessage", {
            get: function () {
                return this._formatterLogMessage;
            },
            set: function (value) {
                this._formatterLogMessage = value;
            },
            enumerable: true,
            configurable: true
        });
        return LogGroupRuntimeSettings;
    }());
    var LogGroupRuntimeSettings_2 = LogGroupRuntimeSettings;


    var LogGroupRuntimeSettings_1 = /*#__PURE__*/Object.defineProperty({
    	LogGroupRuntimeSettings: LogGroupRuntimeSettings_2
    }, '__esModule', {value: true});

    var LoggerFactoryImpl = (function () {
        function LoggerFactoryImpl(name, options) {
            this._loggers = new DataStructures.SimpleMap();
            this._logGroupRuntimeSettingsIndexed = [];
            this._loggerToLogGroupSettings = new DataStructures.SimpleMap();
            this._name = name;
            this.configure(options);
        }
        LoggerFactoryImpl.prototype.configure = function (options) {
            this._options = options;
            // Close any current open loggers.
            this.closeLoggers();
            this._loggerToLogGroupSettings.clear();
            this._logGroupRuntimeSettingsIndexed = [];
            var logGroupRules = this._options.logGroupRules;
            /* tslint:disable:prefer-for-of */
            for (var i = 0; i < logGroupRules.length; i++) {
                this._logGroupRuntimeSettingsIndexed.push(new LogGroupRuntimeSettings_1.LogGroupRuntimeSettings(logGroupRules[i]));
            }
            /* tslint:enable:prefer-for-of */
        };
        LoggerFactoryImpl.prototype.getLogger = function (named) {
            if (!this._options.enabled) {
                throw new Error("LoggerFactory is not enabled, please check your options passed in");
            }
            var logger = this._loggers.get(named);
            if (typeof logger !== "undefined") {
                return logger;
            }
            // Initialize logger with appropriate level
            logger = this.loadLogger(named);
            this._loggers.put(named, logger);
            return logger;
        };
        LoggerFactoryImpl.prototype.isEnabled = function () {
            return this._options.enabled;
        };
        LoggerFactoryImpl.prototype.closeLoggers = function () {
            this._loggers.forEachValue(function (logger) {
                // We can only close if AbstractLogger is used (our loggers, but user loggers may not extend it, even though unlikely).
                if (logger instanceof AbstractLogger_1.AbstractLogger) {
                    logger.close();
                }
            });
            this._loggers.clear();
        };
        LoggerFactoryImpl.prototype.getName = function () {
            return this._name;
        };
        LoggerFactoryImpl.prototype.getLogGroupRuntimeSettingsByIndex = function (idx) {
            if (idx >= 0 && idx < this._logGroupRuntimeSettingsIndexed.length) {
                return this._logGroupRuntimeSettingsIndexed[idx];
            }
            return null;
        };
        LoggerFactoryImpl.prototype.getLogGroupRuntimeSettingsByLoggerName = function (nameLogger) {
            var result = this._loggerToLogGroupSettings.get(nameLogger);
            if (typeof result === "undefined") {
                return null;
            }
            return result;
        };
        LoggerFactoryImpl.prototype.getLogGroupRuntimeSettings = function () {
            return this._logGroupRuntimeSettingsIndexed.slice(0);
        };
        LoggerFactoryImpl.prototype.loadLogger = function (named) {
            var logGroupRules = this._options.logGroupRules;
            for (var i = 0; i < logGroupRules.length; i++) {
                var logGroupRule = logGroupRules[i];
                if (logGroupRule.regExp.test(named)) {
                    var logGroupRuntimeSettings = this._logGroupRuntimeSettingsIndexed[i];
                    var logger = void 0;
                    switch (logGroupRule.loggerType) {
                        case LoggerOptions.LoggerType.Console:
                            logger = new ConsoleLoggerImpl_1.ConsoleLoggerImpl(named, logGroupRuntimeSettings);
                            break;
                        case LoggerOptions.LoggerType.MessageBuffer:
                            logger = new MessageBufferLoggerImpl_1.MessageBufferLoggerImpl(named, logGroupRuntimeSettings);
                            break;
                        case LoggerOptions.LoggerType.Custom:
                            if (logGroupRule.callBackLogger != null) {
                                logger = logGroupRule.callBackLogger(named, logGroupRuntimeSettings);
                            }
                            else {
                                throw new Error("Cannot create a custom logger, custom callback is null");
                            }
                            break;
                        default:
                            throw new Error("Cannot create a Logger for LoggerType: " + logGroupRule.loggerType);
                    }
                    // For a new logger map it by its name
                    this._loggerToLogGroupSettings.put(named, logGroupRuntimeSettings);
                    return logger;
                }
            }
            throw new Error("Failed to find a match to create a Logger for: " + named);
        };
        return LoggerFactoryImpl;
    }());
    var LoggerFactoryImpl_2 = LoggerFactoryImpl;


    var LoggerFactoryImpl_1 = /*#__PURE__*/Object.defineProperty({
    	LoggerFactoryImpl: LoggerFactoryImpl_2
    }, '__esModule', {value: true});

    var CategoryLogMessageImpl = (function () {
        function CategoryLogMessageImpl(message, error, categories, date, level, logFormat, ready) {
            this._resolvedErrorMessage = false;
            this._errorAsStack = null;
            this._message = message;
            this._error = error;
            this._categories = categories;
            this._date = date;
            this._level = level;
            this._logFormat = logFormat;
            this._ready = ready;
        }
        Object.defineProperty(CategoryLogMessageImpl.prototype, "message", {
            get: function () {
                return this._message;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CategoryLogMessageImpl.prototype, "error", {
            get: function () {
                return this._error;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CategoryLogMessageImpl.prototype, "categories", {
            get: function () {
                return this._categories;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CategoryLogMessageImpl.prototype, "date", {
            get: function () {
                return this._date;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CategoryLogMessageImpl.prototype, "level", {
            get: function () {
                return this._level;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CategoryLogMessageImpl.prototype, "logFormat", {
            get: function () {
                return this._logFormat;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CategoryLogMessageImpl.prototype, "isMessageLogData", {
            get: function () {
                return typeof (this._message) !== "string";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CategoryLogMessageImpl.prototype, "messageAsString", {
            get: function () {
                if (typeof (this._message) === "string") {
                    return this._message;
                }
                return this._message.msg;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CategoryLogMessageImpl.prototype, "logData", {
            get: function () {
                var result = null;
                if (typeof (this._message) !== "string") {
                    result = this.message;
                }
                return result;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CategoryLogMessageImpl.prototype, "isResolvedErrorMessage", {
            get: function () {
                return this._resolvedErrorMessage;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CategoryLogMessageImpl.prototype, "errorAsStack", {
            get: function () {
                return this._errorAsStack;
            },
            set: function (stack) {
                this._errorAsStack = stack;
            },
            enumerable: true,
            configurable: true
        });
        CategoryLogMessageImpl.prototype.isReady = function () {
            return this._ready;
        };
        CategoryLogMessageImpl.prototype.setReady = function (value) {
            this._ready = value;
        };
        Object.defineProperty(CategoryLogMessageImpl.prototype, "resolvedErrorMessage", {
            get: function () {
                return this._resolvedErrorMessage;
            },
            set: function (value) {
                this._resolvedErrorMessage = value;
            },
            enumerable: true,
            configurable: true
        });
        return CategoryLogMessageImpl;
    }());
    /**
     * Abstract category logger, use as your base class for new type of loggers (it
     * saves you a lot of work) and override doLog(CategoryLogMessage). The message argument
     * provides full access to anything related to the logging event.
     * If you just want the standard line of logging, call: this.createDefaultLogMessage(msg) on
     * this class which will return you the formatted log message as string (e.g. the
     * default loggers all use this).
     */
    var AbstractCategoryLogger = (function () {
        function AbstractCategoryLogger(rootCategory, runtimeSettings) {
            this.allMessages = new DataStructures.LinkedList();
            this.rootCategory = rootCategory;
            this.runtimeSettings = runtimeSettings;
        }
        AbstractCategoryLogger.prototype.trace = function (msg) {
            var categories = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                categories[_i - 1] = arguments[_i];
            }
            this._log.apply(this, [LoggerOptions.LogLevel.Trace, msg, null, false].concat(categories));
        };
        AbstractCategoryLogger.prototype.debug = function (msg) {
            var categories = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                categories[_i - 1] = arguments[_i];
            }
            this._log.apply(this, [LoggerOptions.LogLevel.Debug, msg, null, false].concat(categories));
        };
        AbstractCategoryLogger.prototype.info = function (msg) {
            var categories = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                categories[_i - 1] = arguments[_i];
            }
            this._log.apply(this, [LoggerOptions.LogLevel.Info, msg, null, false].concat(categories));
        };
        AbstractCategoryLogger.prototype.warn = function (msg) {
            var categories = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                categories[_i - 1] = arguments[_i];
            }
            this._log.apply(this, [LoggerOptions.LogLevel.Warn, msg, null, false].concat(categories));
        };
        AbstractCategoryLogger.prototype.error = function (msg, error) {
            var categories = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                categories[_i - 2] = arguments[_i];
            }
            this._log.apply(this, [LoggerOptions.LogLevel.Error, msg, error, false].concat(categories));
        };
        AbstractCategoryLogger.prototype.fatal = function (msg, error) {
            var categories = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                categories[_i - 2] = arguments[_i];
            }
            this._log.apply(this, [LoggerOptions.LogLevel.Fatal, msg, error, false].concat(categories));
        };
        AbstractCategoryLogger.prototype.resolved = function (msg, error) {
            var categories = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                categories[_i - 2] = arguments[_i];
            }
            this._log.apply(this, [LoggerOptions.LogLevel.Error, msg, error, true].concat(categories));
        };
        AbstractCategoryLogger.prototype.log = function (level, msg, error) {
            var categories = [];
            for (var _i = 3; _i < arguments.length; _i++) {
                categories[_i - 3] = arguments[_i];
            }
            this._log.apply(this, [level, msg, error, false].concat(categories));
        };
        AbstractCategoryLogger.prototype.getRootCategory = function () {
            return this.rootCategory;
        };
        AbstractCategoryLogger.prototype.createDefaultLogMessage = function (msg) {
            return MessageUtils.MessageFormatUtils.renderDefaultMessage(msg, true);
        };
        /**
         * Return optional message formatter. All LoggerTypes (except custom) will see if
         * they have this, and if so use it to log.
         * @returns {((message:CategoryLogMessage)=>string)|null}
         */
        AbstractCategoryLogger.prototype._getMessageFormatter = function () {
            var categorySettings = this.runtimeSettings.getCategorySettings(this.rootCategory);
            // Should not happen but make ts happy
            if (categorySettings === null) {
                throw new Error("Did not find CategorySettings for rootCategory: " + this.rootCategory.name);
            }
            return categorySettings.formatterLogMessage;
        };
        AbstractCategoryLogger.prototype._log = function (level, msg, error, resolved) {
            if (error === void 0) { error = null; }
            if (resolved === void 0) { resolved = false; }
            var categories = [];
            for (var _i = 4; _i < arguments.length; _i++) {
                categories[_i - 4] = arguments[_i];
            }
            // this._logInternal(level, () => msg, () => error, resolved, ...categories);
            var functionMessage = function () {
                if (typeof msg === "function") {
                    return msg();
                }
                return msg;
            };
            var functionError = function () {
                if (typeof error === "function") {
                    return error();
                }
                return error;
            };
            this._logInternal.apply(this, [level, functionMessage, functionError, resolved].concat(categories));
        };
        AbstractCategoryLogger.prototype._logInternal = function (level, msg, error, resolved) {
            var _this = this;
            var categories = [];
            for (var _i = 4; _i < arguments.length; _i++) {
                categories[_i - 4] = arguments[_i];
            }
            var logCategories = [this.rootCategory];
            // Log root category by default if none present
            if (typeof categories !== "undefined" && categories.length > 0) {
                logCategories = logCategories.concat(categories.filter(function (c) { return c !== _this.rootCategory; }));
            }
            var _loop_1 = function (i) {
                var category = logCategories[i];
                if (category === null) {
                    throw new Error("Cannot have a null element within categories, at index=" + i);
                }
                var settings = this_1.runtimeSettings.getCategorySettings(category);
                if (settings === null) {
                    throw new Error("Category with path: " + category.getCategoryPath() + " is not registered with this logger, maybe " +
                        "you registered it with a different root logger?");
                }
                if (settings.logLevel <= level) {
                    var actualError = error !== null ? error() : null;
                    if (actualError === null) {
                        var logMessage = new CategoryLogMessageImpl(msg(), actualError, logCategories, new Date(), level, settings.logFormat, true);
                        logMessage.resolvedErrorMessage = resolved;
                        this_1.allMessages.addTail(logMessage);
                        this_1.processMessages();
                    }
                    else {
                        var logMessage_1 = new CategoryLogMessageImpl(msg(), actualError, logCategories, new Date(), level, settings.logFormat, false);
                        logMessage_1.resolvedErrorMessage = resolved;
                        this_1.allMessages.addTail(logMessage_1);
                        MessageUtils.MessageFormatUtils.renderError(actualError).then(function (stack) {
                            logMessage_1.errorAsStack = stack;
                            logMessage_1.setReady(true);
                            _this.processMessages();
                        }).catch(function () {
                            logMessage_1.errorAsStack = "<UNKNOWN> unable to get stack.";
                            logMessage_1.setReady(true);
                            _this.processMessages();
                        });
                    }
                    return "break";
                }
            };
            var this_1 = this;
            // Get the runtime levels for given categories. If their level is lower than given level, we log.
            // In addition we pass along which category/categories we log this statement for.
            for (var i = 0; i < logCategories.length; i++) {
                var state_1 = _loop_1(i);
                if (state_1 === "break")
                    break;
            }
        };
        AbstractCategoryLogger.prototype.processMessages = function () {
            // Basically we wait until errors are resolved (those messages
            // may not be ready).
            var msgs = this.allMessages;
            if (msgs.getSize() > 0) {
                do {
                    var msg = msgs.getHead();
                    if (msg != null) {
                        if (!msg.isReady()) {
                            break;
                        }
                        msgs.removeHead();
                        this.doLog(msg);
                    }
                } while (msgs.getSize() > 0);
            }
        };
        return AbstractCategoryLogger;
    }());
    var AbstractCategoryLogger_2 = AbstractCategoryLogger;


    var AbstractCategoryLogger_1 = /*#__PURE__*/Object.defineProperty({
    	AbstractCategoryLogger: AbstractCategoryLogger_2
    }, '__esModule', {value: true});

    var __extends$2 = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();



    /**
     * Simple logger, that logs to the console. If the console is unavailable will throw an exception.
     */
    var CategoryConsoleLoggerImpl = (function (_super) {
        __extends$2(CategoryConsoleLoggerImpl, _super);
        function CategoryConsoleLoggerImpl(rootCategory, runtimeSettings) {
            return _super.call(this, rootCategory, runtimeSettings) || this;
        }
        CategoryConsoleLoggerImpl.prototype.doLog = function (msg) {
            if (console !== undefined) {
                var messageFormatter = this._getMessageFormatter();
                var fullMsg = void 0;
                if (messageFormatter === null) {
                    fullMsg = this.createDefaultLogMessage(msg);
                }
                else {
                    fullMsg = messageFormatter(msg);
                }
                var logged = false;
                /* tslint:disable:no-console */
                switch (msg.level) {
                    case LoggerOptions.LogLevel.Trace:
                        // Don't try trace we don't want stacks
                        break;
                    case LoggerOptions.LogLevel.Debug:
                        // Don't try, too much differences of consoles.
                        break;
                    case LoggerOptions.LogLevel.Info:
                        if (console.info) {
                            console.info(fullMsg);
                            logged = true;
                        }
                        break;
                    case LoggerOptions.LogLevel.Warn:
                        if (console.warn) {
                            console.warn(fullMsg);
                            logged = true;
                        }
                        break;
                    case LoggerOptions.LogLevel.Error:
                    case LoggerOptions.LogLevel.Fatal:
                        if (console.error) {
                            console.error(fullMsg);
                            logged = true;
                        }
                        break;
                    default:
                        throw new Error("Unsupported level: " + msg.level);
                }
                if (!logged) {
                    console.log(fullMsg);
                }
                /* tslint:enable:no-console */
            }
            else {
                throw new Error("Console is not defined, cannot log msg: " + msg.messageAsString);
            }
        };
        return CategoryConsoleLoggerImpl;
    }(AbstractCategoryLogger_1.AbstractCategoryLogger));
    var CategoryConsoleLoggerImpl_2 = CategoryConsoleLoggerImpl;


    var CategoryConsoleLoggerImpl_1 = /*#__PURE__*/Object.defineProperty({
    	CategoryConsoleLoggerImpl: CategoryConsoleLoggerImpl_2
    }, '__esModule', {value: true});

    /**
     * Delegate logger, delegates logging to given logger (constructor).
     */
    var CategoryDelegateLoggerImpl = (function () {
        function CategoryDelegateLoggerImpl(delegate) {
            this._delegate = delegate;
        }
        Object.defineProperty(CategoryDelegateLoggerImpl.prototype, "delegate", {
            get: function () {
                return this._delegate;
            },
            set: function (value) {
                this._delegate = value;
            },
            enumerable: true,
            configurable: true
        });
        CategoryDelegateLoggerImpl.prototype.trace = function (msg) {
            var categories = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                categories[_i - 1] = arguments[_i];
            }
            (_a = this._delegate).trace.apply(_a, [msg].concat(categories));
            var _a;
        };
        CategoryDelegateLoggerImpl.prototype.debug = function (msg) {
            var categories = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                categories[_i - 1] = arguments[_i];
            }
            (_a = this._delegate).debug.apply(_a, [msg].concat(categories));
            var _a;
        };
        CategoryDelegateLoggerImpl.prototype.info = function (msg) {
            var categories = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                categories[_i - 1] = arguments[_i];
            }
            (_a = this._delegate).info.apply(_a, [msg].concat(categories));
            var _a;
        };
        CategoryDelegateLoggerImpl.prototype.warn = function (msg) {
            var categories = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                categories[_i - 1] = arguments[_i];
            }
            (_a = this._delegate).warn.apply(_a, [msg].concat(categories));
            var _a;
        };
        CategoryDelegateLoggerImpl.prototype.error = function (msg, error) {
            var categories = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                categories[_i - 2] = arguments[_i];
            }
            (_a = this._delegate).error.apply(_a, [msg, error].concat(categories));
            var _a;
        };
        CategoryDelegateLoggerImpl.prototype.fatal = function (msg, error) {
            var categories = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                categories[_i - 2] = arguments[_i];
            }
            (_a = this._delegate).fatal.apply(_a, [msg, error].concat(categories));
            var _a;
        };
        CategoryDelegateLoggerImpl.prototype.resolved = function (msg, error) {
            var categories = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                categories[_i - 2] = arguments[_i];
            }
            (_a = this._delegate).resolved.apply(_a, [msg, error].concat(categories));
            var _a;
        };
        CategoryDelegateLoggerImpl.prototype.log = function (level, msg, error) {
            var categories = [];
            for (var _i = 3; _i < arguments.length; _i++) {
                categories[_i - 3] = arguments[_i];
            }
            (_a = this._delegate).log.apply(_a, [level, msg, error].concat(categories));
            var _a;
        };
        return CategoryDelegateLoggerImpl;
    }());
    var CategoryDelegateLoggerImpl_2 = CategoryDelegateLoggerImpl;


    var CategoryDelegateLoggerImpl_1 = /*#__PURE__*/Object.defineProperty({
    	CategoryDelegateLoggerImpl: CategoryDelegateLoggerImpl_2
    }, '__esModule', {value: true});

    var __extends$3 = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();



    /**
     * This class should not be used directly, it is used for communication with the extension only.
     */
    var CategoryExtensionLoggerImpl = (function (_super) {
        __extends$3(CategoryExtensionLoggerImpl, _super);
        function CategoryExtensionLoggerImpl(rootCategory, runtimeSettings) {
            return _super.call(this, rootCategory, runtimeSettings) || this;
        }
        CategoryExtensionLoggerImpl.prototype.doLog = function (msg) {
            if (typeof window !== "undefined") {
                ExtensionHelper_1.ExtensionHelper.sendCategoryLogMessage(msg);
            }
            else {
                /* tslint:disable:no-console */
                console.log("window is not available, you must be running in a browser for this. Dropped message.");
                /* tslint:enable:no-console */
            }
        };
        return CategoryExtensionLoggerImpl;
    }(AbstractCategoryLogger_1.AbstractCategoryLogger));
    var CategoryExtensionLoggerImpl_2 = CategoryExtensionLoggerImpl;


    var CategoryExtensionLoggerImpl_1 = /*#__PURE__*/Object.defineProperty({
    	CategoryExtensionLoggerImpl: CategoryExtensionLoggerImpl_2
    }, '__esModule', {value: true});

    var __extends$4 = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();


    /**
     * Logger which buffers all messages, use with care due to possible high memory footprint.
     * Can be convenient in some cases. Call toString() for full output, or cast to this class
     * and call getMessages() to do something with it yourself.
     */
    var CategoryMessageBufferLoggerImpl = (function (_super) {
        __extends$4(CategoryMessageBufferLoggerImpl, _super);
        function CategoryMessageBufferLoggerImpl() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.messages = [];
            return _this;
        }
        CategoryMessageBufferLoggerImpl.prototype.getMessages = function () {
            return this.messages;
        };
        CategoryMessageBufferLoggerImpl.prototype.toString = function () {
            return this.messages.map(function (msg) {
                return msg;
            }).join("\n");
        };
        CategoryMessageBufferLoggerImpl.prototype.doLog = function (msg) {
            var messageFormatter = this._getMessageFormatter();
            var fullMsg;
            if (messageFormatter === null) {
                fullMsg = this.createDefaultLogMessage(msg);
            }
            else {
                fullMsg = messageFormatter(msg);
            }
            this.messages.push(fullMsg);
        };
        return CategoryMessageBufferLoggerImpl;
    }(AbstractCategoryLogger_1.AbstractCategoryLogger));
    var CategoryMessageBufferLoggerImpl_1 = CategoryMessageBufferLoggerImpl;


    var CategoryMessageBufferImpl = /*#__PURE__*/Object.defineProperty({
    	CategoryMessageBufferLoggerImpl: CategoryMessageBufferLoggerImpl_1
    }, '__esModule', {value: true});

    /**
     * RuntimeSettings for a category, at runtime these are associated to a category.
     */
    var CategoryRuntimeSettings = (function () {
        function CategoryRuntimeSettings(category, logLevel, loggerType, logFormat, callBackLogger, formatterLogMessage) {
            if (logLevel === void 0) { logLevel = LoggerOptions.LogLevel.Error; }
            if (loggerType === void 0) { loggerType = LoggerOptions.LoggerType.Console; }
            if (logFormat === void 0) { logFormat = new LoggerOptions.CategoryLogFormat(); }
            if (callBackLogger === void 0) { callBackLogger = null; }
            if (formatterLogMessage === void 0) { formatterLogMessage = null; }
            this._formatterLogMessage = null;
            this._category = category;
            this._logLevel = logLevel;
            this._loggerType = loggerType;
            this._logFormat = logFormat;
            this._callBackLogger = callBackLogger;
            this._formatterLogMessage = formatterLogMessage;
        }
        Object.defineProperty(CategoryRuntimeSettings.prototype, "category", {
            get: function () {
                return this._category;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CategoryRuntimeSettings.prototype, "logLevel", {
            get: function () {
                return this._logLevel;
            },
            set: function (value) {
                this._logLevel = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CategoryRuntimeSettings.prototype, "loggerType", {
            get: function () {
                return this._loggerType;
            },
            set: function (value) {
                this._loggerType = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CategoryRuntimeSettings.prototype, "logFormat", {
            get: function () {
                return this._logFormat;
            },
            set: function (value) {
                this._logFormat = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CategoryRuntimeSettings.prototype, "callBackLogger", {
            get: function () {
                return this._callBackLogger;
            },
            set: function (value) {
                this._callBackLogger = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CategoryRuntimeSettings.prototype, "formatterLogMessage", {
            get: function () {
                return this._formatterLogMessage;
            },
            set: function (value) {
                this._formatterLogMessage = value;
            },
            enumerable: true,
            configurable: true
        });
        return CategoryRuntimeSettings;
    }());
    var CategoryRuntimeSettings_2 = CategoryRuntimeSettings;


    var CategoryRuntimeSettings_1 = /*#__PURE__*/Object.defineProperty({
    	CategoryRuntimeSettings: CategoryRuntimeSettings_2
    }, '__esModule', {value: true});

    /**
     * Default configuration, can be used to initially set a different default configuration
     * on the CategoryServiceFactory. This will be applied to all categories already registered (or
     * registered in the future). Can also be applied to one Category (and childs).
     */
    var CategoryConfiguration = (function () {
        /**
         * Create a new instance
         * @param logLevel Log level for all loggers, default is LogLevel.Error
         * @param loggerType Where to log, default is LoggerType.Console
         * @param logFormat What logging format to use, use default instance, for default values see CategoryLogFormat.
         * @param callBackLogger Optional callback, if LoggerType.Custom is used as loggerType. In that case must return a new Logger instance.
         *            It is recommended to extend AbstractCategoryLogger to make your custom logger.
         */
        function CategoryConfiguration(logLevel, loggerType, logFormat, callBackLogger) {
            if (logLevel === void 0) { logLevel = LoggerOptions.LogLevel.Error; }
            if (loggerType === void 0) { loggerType = LoggerOptions.LoggerType.Console; }
            if (logFormat === void 0) { logFormat = new LoggerOptions.CategoryLogFormat(); }
            if (callBackLogger === void 0) { callBackLogger = null; }
            this._formatterLogMessage = null;
            this._logLevel = logLevel;
            this._loggerType = loggerType;
            this._logFormat = logFormat;
            this._callBackLogger = callBackLogger;
            if (this._loggerType === LoggerOptions.LoggerType.Custom && this.callBackLogger === null) {
                throw new Error("If you specify loggerType to be Custom, you must provide the callBackLogger argument");
            }
        }
        Object.defineProperty(CategoryConfiguration.prototype, "logLevel", {
            get: function () {
                return this._logLevel;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CategoryConfiguration.prototype, "loggerType", {
            get: function () {
                return this._loggerType;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CategoryConfiguration.prototype, "logFormat", {
            get: function () {
                return this._logFormat;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CategoryConfiguration.prototype, "callBackLogger", {
            get: function () {
                return this._callBackLogger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CategoryConfiguration.prototype, "formatterLogMessage", {
            /**
             * Get the formatterLogMessage function, see comment on the setter.
             * @returns {((message:CategoryLogMessage)=>string)|null}
             */
            get: function () {
                return this._formatterLogMessage;
            },
            /**
             * Set the default formatterLogMessage function, if set it is applied to all type of loggers except for a custom logger.
             * By default this is null (not set). You can assign a function to allow custom formatting of a log message.
             * Each log message will call this function then and expects your function to format the message and return a string.
             * Will throw an error if you attempt to set a formatterLogMessage if the LoggerType is custom.
             * @param value The formatter function, or null to reset it.
             */
            set: function (value) {
                if (value !== null && this._loggerType === LoggerOptions.LoggerType.Custom) {
                    throw new Error("You cannot specify a formatter for log messages if your loggerType is Custom");
                }
                this._formatterLogMessage = value;
            },
            enumerable: true,
            configurable: true
        });
        CategoryConfiguration.prototype.copy = function () {
            var config = new CategoryConfiguration(this.logLevel, this.loggerType, this.logFormat.copy(), this.callBackLogger);
            config.formatterLogMessage = this.formatterLogMessage;
            return config;
        };
        return CategoryConfiguration;
    }());
    var CategoryConfiguration_2 = CategoryConfiguration;


    var CategoryConfiguration_1 = /*#__PURE__*/Object.defineProperty({
    	CategoryConfiguration: CategoryConfiguration_2
    }, '__esModule', {value: true});

    /**
     * The service (only available as singleton) for all category related stuff as
     * retrieving, registering a logger. You should normally NOT use this,
     * instead use CategoryServiceFactory which is meant for end users.
     */
    var CategoryServiceImpl = (function () {
        function CategoryServiceImpl() {
            this._defaultConfig = new CategoryConfiguration_1.CategoryConfiguration();
            this._mapState = new DataStructures.SimpleMap();
            // Private constructor
            ExtensionHelper_1.ExtensionHelper.register();
        }
        CategoryServiceImpl.getInstance = function () {
            // Load on-demand, to assure webpack ordering of module usage doesn't screw things over
            // for us when we accidentally change the order.
            if (CategoryServiceImpl._INSTANCE === null) {
                CategoryServiceImpl._INSTANCE = new CategoryServiceImpl();
            }
            return CategoryServiceImpl._INSTANCE;
        };
        CategoryServiceImpl.prototype.getLogger = function (category) {
            return this.createOrGetCategoryState(category).logger;
        };
        /**
         * Clears everything, including a default configuration you may have set.
         * After this you need to re-register your categories etc.
         */
        CategoryServiceImpl.prototype.clear = function () {
            this._mapState.clear();
            this.setDefaultConfiguration(new CategoryConfiguration_1.CategoryConfiguration());
        };
        CategoryServiceImpl.prototype.getCategorySettings = function (category) {
            return this.createOrGetCategoryState(category).currentRuntimeSettings;
        };
        CategoryServiceImpl.prototype.getOriginalCategorySettings = function (category) {
            return this.createOrGetCategoryState(category).originalRuntimeSettings;
        };
        /**
         * Set the default configuration. New root loggers created get this
         * applied. If you want to reset all current loggers to have this
         * applied as well, pass in reset=true (the default is false). All
         * categories will be reset then as well.
         * @param config New config
         * @param reset Defaults to true. Set to true to reset all loggers and current runtimesettings.
         */
        CategoryServiceImpl.prototype.setDefaultConfiguration = function (config, reset) {
            if (reset === void 0) { reset = true; }
            this._defaultConfig = config;
            if (reset) {
                this._mapState.forEachValue(function (state) {
                    state.updateSettings(config);
                });
            }
        };
        /**
         * Set new configuration settings for a category (and possibly its child categories)
         * @param config Config
         * @param category Category
         * @param applyChildren True to apply to child categories, defaults to false.
         */
        CategoryServiceImpl.prototype.setConfigurationCategory = function (config, category, applyChildren) {
            var _this = this;
            if (applyChildren === void 0) { applyChildren = false; }
            this.createOrGetCategoryState(category).updateSettings(config);
            // Apply the settings to children recursive if requested
            if (applyChildren) {
                category.children.forEach(function (child) {
                    // False flag, a child cannot reset a rootlogger
                    _this.setConfigurationCategory(config, child, applyChildren);
                });
            }
        };
        CategoryServiceImpl.prototype.registerCategory = function (category) {
            if (category === null || typeof category === "undefined") {
                throw new Error("Category CANNOT be null/undefined");
            }
            if (this._mapState.exists(CategoryServiceImpl.getCategoryKey(category))) {
                throw new Error("Cannot add this root category with name: " + category.name + ", it already exists (same name in hierarchy).");
            }
            this.createOrGetCategoryState(category);
        };
        /**
         * Used to enable integration with chrome extension. Do not use manually, the
         * extension and the logger framework deal with this.
         */
        CategoryServiceImpl.prototype.enableExtensionIntegration = function () {
            var _this = this;
            this._mapState.forEachValue(function (state) { return state.enableForExtension(_this); });
        };
        /**
         * Return all root categories currently registered.
         */
        CategoryServiceImpl.prototype.getRootCategories = function () {
            return this._mapState.values().filter(function (state) { return state.category.parent == null; }).map(function (state) { return state.category; });
        };
        /**
         * Return Category by id
         * @param id The id of the category to find
         * @returns {Category} or null if not found
         */
        CategoryServiceImpl.prototype.getCategoryById = function (id) {
            var result = this._mapState.values().filter(function (state) { return state.category.id === id; }).map(function (state) { return state.category; });
            if (result.length === 1) {
                return result[0];
            }
            return null;
        };
        CategoryServiceImpl.prototype.createOrGetCategoryState = function (category) {
            var key = CategoryServiceImpl.getCategoryKey(category);
            var state = this._mapState.get(key);
            if (typeof state !== "undefined") {
                return state;
            }
            var newState = this.createState(category);
            this._mapState.put(key, newState);
            return newState;
        };
        CategoryServiceImpl.prototype.createState = function (category) {
            var _this = this;
            return new CategoryState(category, function () { return _this._defaultConfig; }, function (config, cat) { return _this.createLogger(config, cat); });
        };
        CategoryServiceImpl.prototype.createLogger = function (config, category) {
            // Default is always a console logger
            switch (config.loggerType) {
                case LoggerOptions.LoggerType.Console:
                    return new CategoryConsoleLoggerImpl_1.CategoryConsoleLoggerImpl(category, this);
                case LoggerOptions.LoggerType.MessageBuffer:
                    return new CategoryMessageBufferImpl.CategoryMessageBufferLoggerImpl(category, this);
                case LoggerOptions.LoggerType.Custom:
                    if (config.callBackLogger === null) {
                        throw new Error("Cannot create custom logger, custom callback is null");
                    }
                    else {
                        return config.callBackLogger(category, this);
                    }
                default:
                    throw new Error("Cannot create a Logger for LoggerType: " + config.loggerType);
            }
        };
        CategoryServiceImpl.getCategoryKey = function (category) {
            return category.getCategoryPath();
        };
        // Singleton category service, used by CategoryServiceFactory as well as Categories.
        // Loaded on demand. Do NOT change as webpack may pack things in wrong order otherwise.
        CategoryServiceImpl._INSTANCE = null;
        return CategoryServiceImpl;
    }());
    var CategoryServiceImpl_1 = CategoryServiceImpl;
    var CategoryState = (function () {
        function CategoryState(category, defaultConfig, createLogger) {
            this._category = category;
            this._lazyState = new LazyState(category, defaultConfig, createLogger);
        }
        Object.defineProperty(CategoryState.prototype, "category", {
            get: function () {
                return this._category;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CategoryState.prototype, "logger", {
            get: function () {
                return this._lazyState.getLogger();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CategoryState.prototype, "originalRuntimeSettings", {
            get: function () {
                return this._lazyState.getOriginalRuntimeSettings();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CategoryState.prototype, "currentRuntimeSettings", {
            get: function () {
                return this._lazyState.getCurrentRuntimeSettings();
            },
            enumerable: true,
            configurable: true
        });
        CategoryState.prototype.enableForExtension = function (runtimeSettings) {
            this._lazyState.enableForExtension(runtimeSettings);
        };
        CategoryState.prototype.updateSettings = function (config) {
            this._lazyState.updateSettings(config);
        };
        return CategoryState;
    }());
    var LazyState = (function () {
        function LazyState(category, defaultConfig, createLogger) {
            this._category = category;
            this._defaultConfig = defaultConfig;
            this._createLogger = createLogger;
        }
        LazyState.prototype.isLoaded = function () {
            return (typeof this._logger !== "undefined");
        };
        LazyState.prototype.getLogger = function () {
            this.loadLoggerOnDemand();
            return this._delegateLogger;
        };
        LazyState.prototype.getOriginalRuntimeSettings = function () {
            this.loadLoggerOnDemand();
            return this._originalRuntimeSettings;
        };
        LazyState.prototype.getCurrentRuntimeSettings = function () {
            this.loadLoggerOnDemand();
            return this._currentRuntimeSettings;
        };
        LazyState.prototype.enableForExtension = function (runtimeSettings) {
            this.loadLoggerOnDemand();
            if (!(this._wrappedLogger instanceof CategoryExtensionLoggerImpl_1.CategoryExtensionLoggerImpl)) {
                /* tslint:disable no-console */
                console.log("Reconfiguring logger for extension for category: " + this._category.name);
                /* tslint:enable no-console */
                this._wrappedLogger = new CategoryExtensionLoggerImpl_1.CategoryExtensionLoggerImpl(this._category, runtimeSettings);
                this._delegateLogger.delegate = this._wrappedLogger;
            }
        };
        LazyState.prototype.updateSettings = function (config) {
            if (this.isLoaded()) {
                this._currentRuntimeSettings.logLevel = config.logLevel;
                this._currentRuntimeSettings.loggerType = config.loggerType;
                this._currentRuntimeSettings.logFormat = config.logFormat;
                this._currentRuntimeSettings.callBackLogger = config.callBackLogger;
                this._currentRuntimeSettings.formatterLogMessage = config.formatterLogMessage;
                // Replace the real logger, it may have changed.
                this._logger = this._createLogger(config, this._category);
                if (!(this._wrappedLogger instanceof CategoryExtensionLoggerImpl_1.CategoryExtensionLoggerImpl)) {
                    this._wrappedLogger = this._logger;
                }
                this._delegateLogger.delegate = this._wrappedLogger;
            }
            else {
                // Set this config, it may be for the category specific, the default is therefore not good enough.
                this._defaultConfig = function () { return config; };
            }
        };
        LazyState.prototype.loadLoggerOnDemand = function () {
            if (!this.isLoaded()) {
                this._logger = this._createLogger(this._defaultConfig(), this._category);
                this._wrappedLogger = this._logger;
                this._delegateLogger = new CategoryDelegateLoggerImpl_1.CategoryDelegateLoggerImpl(this._wrappedLogger);
                this._originalRuntimeSettings = this.initNewSettings();
                this._currentRuntimeSettings = this.initNewSettings();
            }
        };
        LazyState.prototype.initNewSettings = function () {
            var defSettings = this._defaultConfig().copy();
            return new CategoryRuntimeSettings_1.CategoryRuntimeSettings(this._category, defSettings.logLevel, defSettings.loggerType, defSettings.logFormat, defSettings.callBackLogger, defSettings.formatterLogMessage);
        };
        return LazyState;
    }());


    var CategoryService = /*#__PURE__*/Object.defineProperty({
    	CategoryServiceImpl: CategoryServiceImpl_1
    }, '__esModule', {value: true});

    var ExtensionHelper = (function () {
        function ExtensionHelper() {
            // Private constructor
        }
        /**
         * Enables the window event listener to listen to messages (from extensions).
         * Can be registered/enabled only once.
         */
        ExtensionHelper.register = function () {
            if (!ExtensionHelper.registered) {
                var listener = function (evt) {
                    var msg = evt.data;
                    if (msg !== null) {
                        ExtensionHelper.processMessageFromExtension(msg);
                    }
                };
                if (typeof window !== "undefined" && typeof window.removeEventListener !== "undefined" && typeof window.addEventListener !== "undefined") {
                    window.removeEventListener("message", listener);
                    window.addEventListener("message", listener);
                    ExtensionHelper.registered = true;
                }
            }
        };
        ExtensionHelper.processMessageFromExtension = function (msg) {
            if (!ExtensionHelper.registered) {
                return;
            }
            /* tslint:disable:no-console */
            if (msg.from === "tsl-extension") {
                var data = msg.data;
                switch (data.type) {
                    case "register":
                        ExtensionHelper.enableExtensionIntegration();
                        break;
                    case "request-change-loglevel":
                        var valueRequest = data.value;
                        var catsApplied = ExtensionHelper.applyLogLevel(valueRequest.categoryId, valueRequest.logLevel, valueRequest.recursive);
                        if (catsApplied.length > 0) {
                            // Send changes back
                            ExtensionHelper.sendCategoriesRuntimeUpdateMessage(catsApplied);
                        }
                        break;
                    default:
                        console.log("Unknown command to process message from extension, command was: " + data.type);
                        break;
                }
            }
            /* tslint:enable:no-console */
        };
        ExtensionHelper.sendCategoryLogMessage = function (msg) {
            if (!ExtensionHelper.registered) {
                return;
            }
            var categoryIds = msg.categories.map(function (cat) {
                return cat.id;
            });
            var content = {
                type: "log-message",
                value: {
                    categories: categoryIds,
                    errorAsStack: msg.errorAsStack,
                    formattedMessage: MessageUtils.MessageFormatUtils.renderDefaultMessage(msg, false),
                    logLevel: LoggerOptions.LogLevel[msg.level].toString(),
                    message: msg.messageAsString,
                    resolvedErrorMessage: msg.isResolvedErrorMessage
                }
            };
            var message = {
                data: content,
                from: "tsl-logging",
            };
            ExtensionHelper.sendMessage(message);
        };
        ExtensionHelper.sendCategoriesRuntimeUpdateMessage = function (categories) {
            if (!ExtensionHelper.registered) {
                return;
            }
            var service = CategoryService.CategoryServiceImpl.getInstance();
            var catLevels = { categories: Array() };
            categories.forEach(function (cat) {
                var catSettings = service.getCategorySettings(cat);
                if (catSettings != null) {
                    catLevels.categories.push({ id: cat.id, logLevel: LoggerOptions.LogLevel[catSettings.logLevel].toString() });
                }
            });
            var content = {
                type: "categories-rt-update",
                value: catLevels,
            };
            var message = {
                data: content,
                from: "tsl-logging"
            };
            ExtensionHelper.sendMessage(message);
        };
        ExtensionHelper.sendRootCategoriesToExtension = function () {
            if (!ExtensionHelper.registered) {
                return;
            }
            var categories = CategoryService.CategoryServiceImpl.getInstance().getRootCategories().map(function (cat) {
                return ExtensionHelper.getCategoryAsJSON(cat);
            });
            var content = {
                type: "root-categories-tree",
                value: categories
            };
            var message = {
                data: content,
                from: "tsl-logging"
            };
            ExtensionHelper.sendMessage(message);
        };
        /**
         * If extension integration is enabled, will send the root categories over to the extension.
         * Otherwise does nothing.
         */
        ExtensionHelper.getCategoryAsJSON = function (cat) {
            var childCategories = cat.children.map(function (child) {
                return ExtensionHelper.getCategoryAsJSON(child);
            });
            return {
                children: childCategories,
                id: cat.id,
                logLevel: LoggerOptions.LogLevel[cat.logLevel].toString(),
                name: cat.name,
                parentId: (cat.parent != null ? cat.parent.id : null),
            };
        };
        ExtensionHelper.applyLogLevel = function (categoryId, logLevel, recursive) {
            var cats = [];
            var category = CategoryService.CategoryServiceImpl.getInstance().getCategoryById(categoryId);
            if (category != null) {
                ExtensionHelper._applyLogLevelRecursive(category, LoggerOptions.LogLevel.fromString(logLevel), recursive, cats);
            }
            else {
                /* tslint:disable:no-console */
                console.log("Could not change log level, failed to find category with id: " + categoryId);
                /* tslint:enable:no-console */
            }
            return cats;
        };
        ExtensionHelper._applyLogLevelRecursive = function (category, logLevel, recursive, cats) {
            var categorySettings = CategoryService.CategoryServiceImpl.getInstance().getCategorySettings(category);
            if (categorySettings != null) {
                categorySettings.logLevel = logLevel;
                cats.push(category);
                if (recursive) {
                    category.children.forEach(function (child) {
                        ExtensionHelper._applyLogLevelRecursive(child, logLevel, recursive, cats);
                    });
                }
            }
        };
        ExtensionHelper.getAllCategories = function () {
            var cats = [];
            var addCats = function (cat, allCats) {
                allCats.push(cat);
                cat.children.forEach(function (catChild) {
                    addCats(catChild, allCats);
                });
            };
            CategoryService.CategoryServiceImpl.getInstance().getRootCategories().forEach(function (cat) {
                addCats(cat, cats);
            });
            return cats;
        };
        ExtensionHelper.sendMessage = function (msg) {
            if (!ExtensionHelper.registered) {
                return;
            }
            if (typeof window !== "undefined" && typeof window.postMessage !== "undefined") {
                window.postMessage(msg, "*");
            }
        };
        /**
         *  Extension framework will call this to enable the integration between two,
         *  after this call the framework will respond with postMessage() messages.
         */
        ExtensionHelper.enableExtensionIntegration = function () {
            if (!ExtensionHelper.registered) {
                return;
            }
            var instance = CategoryService.CategoryServiceImpl.getInstance();
            instance.enableExtensionIntegration();
            // Send over all categories
            ExtensionHelper.sendRootCategoriesToExtension();
            // Send over the current runtime levels
            var cats = ExtensionHelper.getAllCategories();
            ExtensionHelper.sendCategoriesRuntimeUpdateMessage(cats);
        };
        ExtensionHelper.registered = false;
        return ExtensionHelper;
    }());
    var ExtensionHelper_2 = ExtensionHelper;


    var ExtensionHelper_1 = /*#__PURE__*/Object.defineProperty({
    	ExtensionHelper: ExtensionHelper_2
    }, '__esModule', {value: true});

    /**
     * Defines a LogGroupRule, this allows you to either have everything configured the same way
     * or for example loggers that start with name model. It allows you to group loggers together
     * to have a certain loglevel and other settings. You can configure this when creating the
     * LoggerFactory (which accepts multiple LogGroupRules).
     */
    var LogGroupRule = (function () {
        /**
         * Create a LogGroupRule. Basically you define what logger name(s) match for this group, what level should be used what logger type (where to log)
         * and what format to write in. If the loggerType is custom, then the callBackLogger must be supplied as callback function to return a custom logger.
         * @param regExp Regular expression, what matches for your logger names for this group
         * @param level LogLevel
         * @param logFormat LogFormat
         * @param loggerType Type of logger, if Custom, make sure to implement callBackLogger and pass in, this will be called so you can return your own logger.
         * @param callBackLogger Callback function to return a new clean custom logger (yours!)
         */
        function LogGroupRule(regExp, level, logFormat, loggerType, callBackLogger) {
            if (logFormat === void 0) { logFormat = new LoggerOptions.LogFormat(); }
            if (loggerType === void 0) { loggerType = LoggerOptions.LoggerType.Console; }
            if (callBackLogger === void 0) { callBackLogger = null; }
            this._formatterLogMessage = null;
            this._regExp = regExp;
            this._level = level;
            this._logFormat = logFormat;
            this._loggerType = loggerType;
            this._callBackLogger = callBackLogger;
        }
        Object.defineProperty(LogGroupRule.prototype, "regExp", {
            get: function () {
                return this._regExp;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LogGroupRule.prototype, "level", {
            get: function () {
                return this._level;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LogGroupRule.prototype, "loggerType", {
            get: function () {
                return this._loggerType;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LogGroupRule.prototype, "logFormat", {
            get: function () {
                return this._logFormat;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LogGroupRule.prototype, "callBackLogger", {
            get: function () {
                return this._callBackLogger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LogGroupRule.prototype, "formatterLogMessage", {
            /**
             * Get the formatterLogMessage function, see comment on the setter.
             * @returns {((message:LogMessage)=>string)|null}
             */
            get: function () {
                return this._formatterLogMessage;
            },
            /**
             * Set the default formatterLogMessage function, if set it is applied to all type of loggers except for a custom logger.
             * By default this is null (not set). You can assign a function to allow custom formatting of a log message.
             * Each log message will call this function then and expects your function to format the message and return a string.
             * Will throw an error if you attempt to set a formatterLogMessage if the LoggerType is custom.
             * @param value The formatter function, or null to reset it.
             */
            set: function (value) {
                if (value !== null && this._loggerType === LoggerOptions.LoggerType.Custom) {
                    throw new Error("You cannot specify a formatter for log messages if your loggerType is Custom");
                }
                this._formatterLogMessage = value;
            },
            enumerable: true,
            configurable: true
        });
        return LogGroupRule;
    }());
    var LogGroupRule_2 = LogGroupRule;


    var LogGroupRule_1 = /*#__PURE__*/Object.defineProperty({
    	LogGroupRule: LogGroupRule_2
    }, '__esModule', {value: true});

    /**
     * Options object you can use to configure the LoggerFactory you create at LFService.
     */
    var LoggerFactoryOptions = (function () {
        function LoggerFactoryOptions() {
            this._logGroupRules = [];
            this._enabled = true;
        }
        /**
         * Add LogGroupRule, see {LogGroupRule) for details
         * @param rule Rule to add
         * @returns {LoggerFactoryOptions} returns itself
         */
        LoggerFactoryOptions.prototype.addLogGroupRule = function (rule) {
            this._logGroupRules.push(rule);
            return this;
        };
        /**
         * Enable or disable logging completely for the LoggerFactory.
         * @param enabled True for enabled (default)
         * @returns {LoggerFactoryOptions} returns itself
         */
        LoggerFactoryOptions.prototype.setEnabled = function (enabled) {
            this._enabled = enabled;
            return this;
        };
        Object.defineProperty(LoggerFactoryOptions.prototype, "logGroupRules", {
            get: function () {
                return this._logGroupRules;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LoggerFactoryOptions.prototype, "enabled", {
            get: function () {
                return this._enabled;
            },
            enumerable: true,
            configurable: true
        });
        return LoggerFactoryOptions;
    }());
    var LoggerFactoryOptions_2 = LoggerFactoryOptions;


    var LoggerFactoryOptions_1 = /*#__PURE__*/Object.defineProperty({
    	LoggerFactoryOptions: LoggerFactoryOptions_2
    }, '__esModule', {value: true});

    var LFServiceImpl = (function () {
        function LFServiceImpl() {
            // Private constructor.
            this._nameCounter = 1;
            this._mapFactories = new DataStructures.SimpleMap();
            ExtensionHelper_1.ExtensionHelper.register();
        }
        LFServiceImpl.getInstance = function () {
            // Loaded on demand. Do NOT change as webpack may pack things in wrong order otherwise.
            if (LFServiceImpl._INSTANCE === null) {
                LFServiceImpl._INSTANCE = new LFServiceImpl();
            }
            return LFServiceImpl._INSTANCE;
        };
        /**
         * Create a new LoggerFactory with given options (if any). If no options
         * are specified, the LoggerFactory, will accept any named logger and will
         * log on info level by default for, to the console.
         * @param options Options, optional.
         * @returns {LoggerFactory}
         */
        LFServiceImpl.prototype.createLoggerFactory = function (options) {
            if (options === void 0) { options = null; }
            var name = "LoggerFactory" + this._nameCounter++;
            return this.createNamedLoggerFactory(name, options);
        };
        /**
         * Create a new LoggerFactory using given name (used for console api/extension).
         * @param name Name Pick something short but distinguishable.
         * @param options Options, optional
         * @return {LoggerFactory}
         */
        LFServiceImpl.prototype.createNamedLoggerFactory = function (name, options) {
            if (options === void 0) { options = null; }
            if (this._mapFactories.exists(name)) {
                throw new Error("LoggerFactory with name " + name + " already exists.");
            }
            var factory;
            if (options !== null) {
                factory = new LoggerFactoryImpl_1.LoggerFactoryImpl(name, options);
            }
            else {
                factory = new LoggerFactoryImpl_1.LoggerFactoryImpl(name, LFServiceImpl.createDefaultOptions());
            }
            this._mapFactories.put(name, factory);
            return factory;
        };
        /**
         * Closes all Loggers for LoggerFactories that were created.
         * After this call, all previously fetched Loggers (from their
         * factories) are unusable. The factories remain as they were.
         */
        LFServiceImpl.prototype.closeLoggers = function () {
            this._mapFactories.values().forEach(function (factory) {
                factory.closeLoggers();
            });
            this._mapFactories.clear();
            this._nameCounter = 1;
        };
        LFServiceImpl.prototype.getRuntimeSettingsForLoggerFactories = function () {
            var result = [];
            this._mapFactories.forEachValue(function (factory) { return result.push(factory); });
            return result;
        };
        LFServiceImpl.prototype.getLogGroupSettings = function (nameLoggerFactory, idLogGroupRule) {
            var factory = this._mapFactories.get(nameLoggerFactory);
            if (typeof factory === "undefined") {
                return null;
            }
            return factory.getLogGroupRuntimeSettingsByIndex(idLogGroupRule);
        };
        LFServiceImpl.prototype.getLoggerFactoryRuntimeSettingsByName = function (nameLoggerFactory) {
            var result = this._mapFactories.get(nameLoggerFactory);
            if (typeof result === "undefined") {
                return null;
            }
            return result;
        };
        LFServiceImpl.createDefaultOptions = function () {
            return new LoggerFactoryOptions_1.LoggerFactoryOptions().addLogGroupRule(new LogGroupRule_1.LogGroupRule(new RegExp(".+"), LoggerOptions.LogLevel.Info));
        };
        // Loaded on demand. Do NOT change as webpack may pack things in wrong order otherwise.
        LFServiceImpl._INSTANCE = null;
        return LFServiceImpl;
    }());
    /**
     * Create and configure your LoggerFactory from here.
     */
    var LFService = (function () {
        function LFService() {
        }
        /**
         * Create a new LoggerFactory with given options (if any). If no options
         * are specified, the LoggerFactory, will accept any named logger and will
         * log on info level by default for, to the console.
         * @param options Options, optional.
         * @returns {LoggerFactory}
         */
        LFService.createLoggerFactory = function (options) {
            if (options === void 0) { options = null; }
            return LFService.INSTANCE_SERVICE.createLoggerFactory(options);
        };
        /**
         * Create a new LoggerFactory using given name (used for console api/extension).
         * @param name Name Pick something short but distinguishable. The word "DEFAULT" is reserved and cannot be taken, it is used
         * for the default LoggerFactory.
         * @param options Options, optional
         * @return {LoggerFactory}
         */
        LFService.createNamedLoggerFactory = function (name, options) {
            if (options === void 0) { options = null; }
            if (name === LFService.DEFAULT_LOGGER_FACTORY_NAME) {
                throw new Error("LoggerFactory name: " + LFService.DEFAULT_LOGGER_FACTORY_NAME + " is reserved and cannot be used.");
            }
            return LFService.INSTANCE_SERVICE.createNamedLoggerFactory(name, options);
        };
        /**
         * Closes all Loggers for LoggerFactories that were created.
         * After this call, all previously fetched Loggers (from their
         * factories) are unusable. The factories remain as they were.
         */
        LFService.closeLoggers = function () {
            return LFService.INSTANCE_SERVICE.closeLoggers();
        };
        /**
         * Return LFServiceRuntimeSettings to retrieve information loggerfactories
         * and their runtime settings.
         * @returns {LFServiceRuntimeSettings}
         */
        LFService.getRuntimeSettings = function () {
            return LFService.INSTANCE_SERVICE;
        };
        Object.defineProperty(LFService, "DEFAULT", {
            /**
             * This property returns the default LoggerFactory (if not yet initialized it is initialized).
             * This LoggerFactory can be used to share among multiple
             * applications/libraries - that way you can enable/change logging over everything from
             * your own application when required.
             * It is recommended to be used by library developers to make logging easily available for the
             * consumers of their libraries.
             * It is highly recommended to use Loggers from the LoggerFactory with unique grouping/names to prevent
             * clashes of Loggers between multiple projects.
             * @returns {LoggerFactory} Returns the default LoggerFactory
             */
            get: function () {
                return LFService.getDefault();
            },
            enumerable: true,
            configurable: true
        });
        LFService.getDefault = function () {
            if (LFService.DEFAULT_LOGGER_FACTORY === null) {
                LFService.DEFAULT_LOGGER_FACTORY = LFService.DEFAULT_LOGGER_FACTORY = LFService.INSTANCE_SERVICE.createNamedLoggerFactory(LFService.DEFAULT_LOGGER_FACTORY_NAME, new LoggerFactoryOptions_1.LoggerFactoryOptions().addLogGroupRule(new LogGroupRule_1.LogGroupRule(new RegExp(".+"), LoggerOptions.LogLevel.Error)));
            }
            return LFService.DEFAULT_LOGGER_FACTORY;
        };
        LFService.DEFAULT_LOGGER_FACTORY_NAME = "DEFAULT";
        LFService.INSTANCE_SERVICE = LFServiceImpl.getInstance();
        LFService.DEFAULT_LOGGER_FACTORY = null;
        return LFService;
    }());
    var LFService_2 = LFService;


    var LFService_1 = /*#__PURE__*/Object.defineProperty({
    	LFService: LFService_2
    }, '__esModule', {value: true});

    var LoggerControlImpl = (function () {
        function LoggerControlImpl() {
        }
        LoggerControlImpl.prototype.help = function () {
            /* tslint:disable:no-console */
            console.log(LoggerControlImpl._help);
            /* tslint:enable:no-console */
        };
        LoggerControlImpl.prototype.listFactories = function () {
            var rtSettingsFactories = LoggerControlImpl._getRuntimeSettingsLoggerFactories();
            var result = new DataStructures.StringBuilder();
            result.appendLine("Registered LoggerFactories (index / name)");
            for (var i = 0; i < rtSettingsFactories.length; i++) {
                var rtSettingsFactory = rtSettingsFactories[i];
                result.append("  " + i).append(": " + rtSettingsFactory.getName() + "\n");
            }
            /* tslint:disable:no-console */
            console.log(result.toString());
            /* tslint:enable:no-console */
        };
        LoggerControlImpl.prototype.showSettings = function (id) {
            if (id === void 0) { id = "all"; }
            var result = [];
            if (id === "all") {
                var idx_1 = 0;
                LoggerControlImpl._getRuntimeSettingsLoggerFactories().forEach(function (item) {
                    result.push(new DataStructures.TuplePair(idx_1++, item));
                });
            }
            else {
                var settings = LoggerControlImpl._getRuntimeSettingsLoggerFactories();
                if (id >= 0 && id < settings.length) {
                    result.push(new DataStructures.TuplePair(id, settings[id]));
                }
                else {
                    throw new Error("Requested number: " + id + " was not found.");
                }
            }
            for (var _i = 0, result_1 = result; _i < result_1.length; _i++) {
                var setting = result_1[_i];
                /* tslint:disable:no-console */
                console.log("  LoggerFactory: " + setting.y.getName() + " (id=" + setting.x + ")");
                var logGroupRuntimeSettings = setting.y.getLogGroupRuntimeSettings();
                for (var g = 0; g < logGroupRuntimeSettings.length; g++) {
                    var groupSetting = logGroupRuntimeSettings[g];
                    console.log("     LogGroup: (id=" + g + ")");
                    console.log("       RegExp: " + groupSetting.logGroupRule.regExp.source);
                    console.log("       Level: " + LoggerOptions.LogLevel[groupSetting.level].toString());
                    console.log("       LoggerType: " + LoggerOptions.LoggerType[groupSetting.loggerType].toString());
                }
                /* tslint:enable:no-console */
            }
        };
        LoggerControlImpl.prototype.reset = function (idFactory) {
            if (idFactory === void 0) { idFactory = "all"; }
            var loggerFactoriesSettings = LoggerControlImpl._getRuntimeSettingsLoggerFactories();
            var result = [];
            if (idFactory === "all") {
                result = loggerFactoriesSettings;
            }
            else {
                if (idFactory >= 0 && idFactory < loggerFactoriesSettings.length) {
                    result.push(loggerFactoriesSettings[idFactory]);
                }
            }
            result.forEach(function (setting) {
                /* tslint:disable:no-console */
                console.log("Reset all settings for factory " + idFactory);
                /* tslint:enable:no-console */
                var control = new LoggerFactoryControlImpl(setting);
                control.reset();
            });
        };
        LoggerControlImpl.prototype.getLoggerFactoryControl = function (idFactory) {
            var loggerFactoriesSettings = LoggerControlImpl._getRuntimeSettingsLoggerFactories();
            if (idFactory >= 0 && idFactory < loggerFactoriesSettings.length) {
                return new LoggerFactoryControlImpl(loggerFactoriesSettings[idFactory]);
            }
            throw new Error("idFactory is invalid (less than 0) or non existing id.");
        };
        LoggerControlImpl._getRuntimeSettingsLoggerFactories = function () {
            return LoggerControlImpl._getSettings().getRuntimeSettingsForLoggerFactories();
        };
        LoggerControlImpl._getSettings = function () {
            return LFService_1.LFService.getRuntimeSettings();
        };
        LoggerControlImpl._help = "\n  help(): void\n    ** Shows this help.\n\n  listFactories(): void\n    ** List all registered LoggerFactories with associated log groups with respective ids (ids can be used to target a factory and/or group).\n\n  showSettings(idFactory: number | \"all\"): void\n    ** Show log group settings for idFactory (use listFactories to find id for a LoggerFactory). If idFactory is \"all\" shows all factories.\n\n  getLoggerFactoryControl(idFactory: number): LoggerFactoryControl\n    ** Return LoggerFactoryControl when found for given idFactory or throws Error if invalid or null, get the id by using listFactories()\n\n  reset(idFactory: number | \"all\"): void\n    ** Resets given factory or all factories back to original values.\n";
        return LoggerControlImpl;
    }());
    var LoggerControlImpl_1 = LoggerControlImpl;
    var LoggerFactoryControlImpl = (function () {
        function LoggerFactoryControlImpl(settings) {
            this._settings = settings;
        }
        LoggerFactoryControlImpl.prototype.help = function () {
            /* tslint:disable:no-console */
            console.log(LoggerFactoryControlImpl._help);
            /* tslint:enable:no-console */
        };
        LoggerFactoryControlImpl.prototype.example = function () {
            /* tslint:disable:no-console */
            console.log(LoggerFactoryControlImpl._example);
            /* tslint:enable:no-console */
        };
        LoggerFactoryControlImpl.prototype.showSettings = function (id) {
            var result = new DataStructures.StringBuilder();
            var logGroupRuntimeSettings = this._settings.getLogGroupRuntimeSettings();
            result.appendLine("Registered LogGroups (index / expression)");
            for (var i = 0; i < logGroupRuntimeSettings.length; i++) {
                var logGroupRuntimeSetting = logGroupRuntimeSettings[i];
                result.appendLine("  " + i + ": " + logGroupRuntimeSetting.logGroupRule.regExp.source + ", logLevel=" +
                    LoggerOptions.LogLevel[logGroupRuntimeSetting.level].toString() + ", showTimestamp=" + logGroupRuntimeSetting.logFormat.showTimeStamp +
                    ", showLoggerName=" + logGroupRuntimeSetting.logFormat.showLoggerName +
                    ", format=" + LoggerOptions.DateFormatEnum[logGroupRuntimeSetting.logFormat.dateFormat.formatEnum].toString());
            }
            /* tslint:disable:no-console */
            console.log(result.toString());
            /* tslint:enable:no-console */
        };
        LoggerFactoryControlImpl.prototype.change = function (settings) {
            var logGroupRuntimeSettings = this._getLogGroupRunTimeSettingsFor(settings.group);
            var logLevel = null;
            var formatEnum = null;
            var showLoggerName = null;
            var showTimestamp = null;
            var result = null;
            var addResult = function (value) {
                if (result !== null) {
                    result += ", ";
                }
                if (result === null) {
                    result = value;
                }
                else {
                    result += value;
                }
            };
            if (typeof settings.logLevel === "string") {
                logLevel = LoggerOptions.LogLevel.fromString(settings.logLevel);
                addResult("logLevel=" + settings.logLevel);
            }
            if (typeof settings.logFormat === "string") {
                formatEnum = LoggerOptions.DateFormatEnum.fromString(settings.logFormat);
                addResult("logFormat=" + settings.logFormat);
            }
            if (typeof settings.showLoggerName === "boolean") {
                showLoggerName = settings.showLoggerName;
                addResult("showLoggerName=" + settings.showLoggerName);
            }
            if (typeof settings.showTimestamp === "boolean") {
                showTimestamp = settings.showTimestamp;
                addResult("showTimestamp=" + settings.showTimestamp);
            }
            logGroupRuntimeSettings.forEach(function (s) {
                if (logLevel !== null) {
                    s.level = logLevel;
                }
                if (formatEnum !== null) {
                    s.logFormat.dateFormat.formatEnum = formatEnum;
                }
                if (showTimestamp !== null) {
                    s.logFormat.showTimeStamp = showTimestamp;
                }
                if (showLoggerName !== null) {
                    s.logFormat.showLoggerName = showLoggerName;
                }
            });
            /* tslint:disable:no-console */
            console.log("Applied changes: " + result + " to log groups '" + settings.group + "'.");
            /* tslint:enable:no-console */
        };
        LoggerFactoryControlImpl.prototype.reset = function (idGroup) {
            if (idGroup === void 0) { idGroup = "all"; }
            var settings = this._getLogGroupRunTimeSettingsFor(idGroup);
            for (var _i = 0, settings_1 = settings; _i < settings_1.length; _i++) {
                var setting = settings_1[_i];
                setting.level = setting.logGroupRule.level;
                setting.logFormat.showTimeStamp = setting.logGroupRule.logFormat.showTimeStamp;
                setting.logFormat.showLoggerName = setting.logGroupRule.logFormat.showLoggerName;
                setting.logFormat.dateFormat.formatEnum = setting.logGroupRule.logFormat.dateFormat.formatEnum;
            }
            /* tslint:disable:no-console */
            console.log("Reset all settings for group " + idGroup);
            /* tslint:enable:no-console */
        };
        LoggerFactoryControlImpl.prototype._getLogGroupRunTimeSettingsFor = function (idGroup) {
            var settings = [];
            if (idGroup === "all") {
                settings = this._settings.getLogGroupRuntimeSettings();
            }
            else {
                this._checkIndex(idGroup);
                settings.push(this._settings.getLogGroupRuntimeSettings()[idGroup]);
            }
            return settings;
        };
        LoggerFactoryControlImpl.prototype._checkIndex = function (index) {
            if (index < 0 || index >= this._settings.getLogGroupRuntimeSettings().length) {
                throw new Error("Invalid index, use listLogGroups to find out a valid one.");
            }
        };
        LoggerFactoryControlImpl._help = "\n  help(): void\n    ** Shows this help.\n\n  example(): void\n    ** Shows an example of usage.\n\n  showSettings(id: number | \"all\"): void\n    ** Prints settings for given group id, \"all\" for all group.\n\n  change(settings: LogGroupControlSettings): void\n    ** Changes the current settings for one or all log groups.\n    **\n       LogGroupControlSettings, properties of object:\n         group: number | \"all\"\n           ** Apply to specific group, or \"all\".\n           ** Required\n\n         logLevel: \"Fatal\" | \"Error\" | \"Warn\" | \"Info\" | \"Debug\" | \"Trace\" | undefined\n           ** Set log level, undefined will not change the setting.\n           ** Optional\n\n         logFormat: \"Default\" | \"YearMonthDayTime\" | \"YearDayMonthWithFullTime\" | \"YearDayMonthTime\" | undefined\n           ** Set the log format, undefined will not change the setting.\n           ** Optional\n\n         showTimestamp: boolean | undefined\n           ** Whether to show timestamp, undefined will not change the setting.\n           ** Optional\n\n         showLoggerName: boolean | undefined\n           ** Whether to show the logger name, undefined will not change the setting.\n           ** Optional\n\n  reset(id: number | \"all\"): void\n    ** Resets everything to original values, for one specific or for all groups.\n\n  help():\n    ** Shows this help.\n";
        LoggerFactoryControlImpl._example = "\n  Examples:\n    change({group: \"all\", logLevel: \"Info\"})\n      ** Change loglevel to Info for all groups.\n\n    change({group: 1, recursive:false, logLevel: \"Warn\"})\n      ** Change logLevel for group 1 to Warn.\n\n    change({group: \"all\", logLevel: \"Debug\", logFormat: \"YearDayMonthTime\", showTimestamp:false, showLoggerName:false})\n      ** Change loglevel to Debug for all groups, apply format, do not show timestamp and logger names.\n";
        return LoggerFactoryControlImpl;
    }());


    var LogGroupControl = /*#__PURE__*/Object.defineProperty({
    	LoggerControlImpl: LoggerControlImpl_1
    }, '__esModule', {value: true});

    /**
     * Implementation class for CategoryServiceControl.
     */
    var CategoryServiceControlImpl = (function () {
        function CategoryServiceControlImpl() {
        }
        CategoryServiceControlImpl.prototype.help = function () {
            /* tslint:disable:no-console */
            console.log(CategoryServiceControlImpl._help);
            /* tslint:enable:no-console */
        };
        CategoryServiceControlImpl.prototype.example = function () {
            /* tslint:disable:no-console */
            console.log(CategoryServiceControlImpl._example);
            /* tslint:enable:no-console */
        };
        CategoryServiceControlImpl.prototype.showSettings = function (id) {
            if (id === void 0) { id = "all"; }
            var result = new DataStructures.StringBuilder();
            var service = CategoryServiceControlImpl._getCategoryService();
            var categories = CategoryServiceControlImpl._getCategories(id);
            categories.forEach(function (category) {
                CategoryServiceControlImpl._processCategory(service, category, result, 0);
            });
            /* tslint:disable:no-console */
            console.log(result.toString());
            /* tslint:enable:no-console */
        };
        CategoryServiceControlImpl.prototype.change = function (settings) {
            var service = CategoryServiceControlImpl._getCategoryService();
            var categories = CategoryServiceControlImpl._getCategories(settings.category);
            var logLevel = null;
            var formatEnum = null;
            var showCategoryName = null;
            var showTimestamp = null;
            var result = null;
            var addResult = function (value) {
                if (result !== null) {
                    result += ", ";
                }
                if (result === null) {
                    result = value;
                }
                else {
                    result += value;
                }
            };
            addResult("recursive=" + settings.recursive);
            if (typeof settings.logLevel === "string") {
                logLevel = LoggerOptions.LogLevel.fromString(settings.logLevel);
                addResult("logLevel=" + settings.logLevel);
            }
            if (typeof settings.logFormat === "string") {
                formatEnum = LoggerOptions.DateFormatEnum.fromString(settings.logFormat);
                addResult("logFormat=" + settings.logFormat);
            }
            if (typeof settings.showCategoryName === "boolean") {
                showCategoryName = settings.showCategoryName;
                addResult("showCategoryName=" + settings.showCategoryName);
            }
            if (typeof settings.showTimestamp === "boolean") {
                showTimestamp = settings.showTimestamp;
                addResult("showTimestamp=" + settings.showTimestamp);
            }
            var applyChanges = function (cat) {
                var categorySettings = service.getCategorySettings(cat);
                // Should not happen but make tslint happy
                if (categorySettings !== null) {
                    if (logLevel !== null) {
                        categorySettings.logLevel = logLevel;
                    }
                    if (formatEnum !== null) {
                        categorySettings.logFormat.dateFormat.formatEnum = formatEnum;
                    }
                    if (showTimestamp !== null) {
                        categorySettings.logFormat.showTimeStamp = showTimestamp;
                    }
                    if (showCategoryName !== null) {
                        categorySettings.logFormat.showCategoryName = showCategoryName;
                    }
                }
            };
            categories.forEach(function (cat) { return CategoryServiceControlImpl._applyToCategory(cat, settings.recursive, applyChanges); });
            /* tslint:disable:no-console */
            console.log("Applied changes: " + result + " to categories '" + settings.category + "'.");
            /* tslint:enable:no-console */
        };
        CategoryServiceControlImpl.prototype.reset = function (id) {
            if (id === void 0) { id = "all"; }
            var service = CategoryServiceControlImpl._getCategoryService();
            var categories = CategoryServiceControlImpl._getCategories(id);
            var applyChanges = function (cat) {
                var categorySettings = service.getCategorySettings(cat);
                var original = service.getOriginalCategorySettings(cat);
                // Should not happen but make tslint happy
                if (categorySettings !== null && original !== null) {
                    categorySettings.logLevel = original.logLevel;
                    categorySettings.logFormat.dateFormat.formatEnum = original.logFormat.dateFormat.formatEnum;
                    categorySettings.logFormat.showTimeStamp = original.logFormat.showTimeStamp;
                    categorySettings.logFormat.showCategoryName = original.logFormat.showCategoryName;
                }
            };
            categories.forEach(function (cat) { return CategoryServiceControlImpl._applyToCategory(cat, true, applyChanges); });
            /* tslint:disable:no-console */
            console.log("Applied reset to category: " + id + ".");
            /* tslint:enable:no-console */
        };
        CategoryServiceControlImpl._processCategory = function (service, category, result, indent) {
            var settings = service.getCategorySettings(category);
            if (settings !== null) {
                result.append("  " + category.id + ": ");
                if (indent > 0) {
                    for (var i = 0; i < indent; i++) {
                        result.append("  ");
                    }
                }
                result.append(category.name + " (" + LoggerOptions.LogLevel[settings.logLevel].toString() + "@" + LoggerOptions.LoggerType[settings.loggerType].toString() + ")\n");
                if (category.children.length > 0) {
                    category.children.forEach(function (child) {
                        CategoryServiceControlImpl._processCategory(service, child, result, indent + 1);
                    });
                }
            }
        };
        CategoryServiceControlImpl._applyToCategory = function (category, recursive, apply) {
            apply(category);
            if (recursive) {
                category.children.forEach(function (child) {
                    CategoryServiceControlImpl._applyToCategory(child, recursive, apply);
                });
            }
        };
        CategoryServiceControlImpl._getCategoryService = function () {
            return CategoryService.CategoryServiceImpl.getInstance();
        };
        CategoryServiceControlImpl._getCategories = function (idCategory) {
            var service = CategoryServiceControlImpl._getCategoryService();
            var categories = [];
            if (idCategory === "all") {
                categories = service.getRootCategories();
            }
            else {
                var category = service.getCategoryById(idCategory);
                if (category === null) {
                    throw new Error("Failed to find category with id " + idCategory);
                }
                categories.push(category);
            }
            return categories;
        };
        CategoryServiceControlImpl._help = "\n  help(): void\n    ** Shows this help.\n\n  example(): void\n    ** Shows an example on how to use this.\n\n  showSettings(id: number | \"all\" = \"all\"): void\n    ** Shows settings for a specific category, or for all. The id of categories can be found by calling this method without parameter.\n\n  change(settings: CategoryServiceControlSettings): void\n    ** Changes the current settings for one or all categories.\n    **\n       CategoryServiceControlSettings, properties of object:\n         category: number | \"all\"\n           ** Apply to specific category, or \"all\".\n           ** Required\n\n         recursive: boolean\n           ** Apply to child categories (true) or not.\n           ** Required\n\n         logLevel: \"Fatal\" | \"Error\" | \"Warn\" | \"Info\" | \"Debug\" | \"Trace\" | undefined\n           ** Set log level, undefined will not change the setting.\n           ** Optional\n\n         logFormat: \"Default\" | \"YearMonthDayTime\" | \"YearDayMonthWithFullTime\" | \"YearDayMonthTime\" | undefined\n           ** Set the log format, undefined will not change the setting.\n           ** Optional\n\n         showTimestamp: boolean | undefined\n           ** Whether to show timestamp, undefined will not change the setting.\n           ** Optional\n\n         showCategoryName: boolean | undefined\n           ** Whether to show the category name, undefined will not change the setting.\n           ** Optional\n\n   reset(id: number | \"all\"): void\n     ** Resets everything to original values, for one specific or for all categories.\n";
        CategoryServiceControlImpl._example = "\n  Examples:\n    change({category: \"all\", recursive:true, logLevel: \"Info\"})\n      ** Change loglevel to Info for all categories, apply to child categories as well.\n\n    change({category: 1, recursive:false, logLevel: \"Warn\"})\n      ** Change logLevel for category 1, do not recurse.\n\n    change({category: \"all\", recursive:true, logLevel: \"Debug\", logFormat: \"YearDayMonthTime\", showTimestamp:false, showCategoryName:false})\n      ** Change loglevel to Debug for all categories, apply format, do not show timestamp and category names - recursively to child categories.\n\n";
        return CategoryServiceControlImpl;
    }());
    var CategoryServiceControlImpl_1 = CategoryServiceControlImpl;


    var CategoryServiceControl = /*#__PURE__*/Object.defineProperty({
    	CategoryServiceControlImpl: CategoryServiceControlImpl_1
    }, '__esModule', {value: true});

    /**
     * Category for use with categorized logging.
     * At minimum you need one category, which will serve as the root category.
     * You can create child categories (like a tree). You can have multiple root
     * categories.
     */
    var Category = (function () {
        function Category(name, parent) {
            if (parent === void 0) { parent = null; }
            this._children = [];
            this._logLevel = LoggerOptions.LogLevel.Error;
            if (name.indexOf("#") !== -1) {
                throw new Error("Cannot use # in a name of a Category");
            }
            this._id = Category.nextId();
            this._name = name;
            this._parent = parent;
            if (this._parent !== null) {
                this._parent._children.push(this);
            }
            CategoryService.CategoryServiceImpl.getInstance().registerCategory(this);
        }
        Object.defineProperty(Category.prototype, "name", {
            get: function () {
                return this._name;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Category.prototype, "parent", {
            get: function () {
                return this._parent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Category.prototype, "children", {
            get: function () {
                return this._children;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Category.prototype, "logLevel", {
            get: function () {
                return this._logLevel;
            },
            enumerable: true,
            configurable: true
        });
        Category.prototype.trace = function (msg) {
            var categories = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                categories[_i - 1] = arguments[_i];
            }
            this.loadCategoryLogger();
            (_a = this._logger).trace.apply(_a, [msg].concat(categories));
            var _a;
        };
        Category.prototype.debug = function (msg) {
            var categories = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                categories[_i - 1] = arguments[_i];
            }
            this.loadCategoryLogger();
            (_a = this._logger).debug.apply(_a, [msg].concat(categories));
            var _a;
        };
        Category.prototype.info = function (msg) {
            var categories = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                categories[_i - 1] = arguments[_i];
            }
            this.loadCategoryLogger();
            (_a = this._logger).info.apply(_a, [msg].concat(categories));
            var _a;
        };
        Category.prototype.warn = function (msg) {
            var categories = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                categories[_i - 1] = arguments[_i];
            }
            this.loadCategoryLogger();
            (_a = this._logger).warn.apply(_a, [msg].concat(categories));
            var _a;
        };
        Category.prototype.error = function (msg, error) {
            var categories = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                categories[_i - 2] = arguments[_i];
            }
            this.loadCategoryLogger();
            (_a = this._logger).error.apply(_a, [msg, error].concat(categories));
            var _a;
        };
        Category.prototype.fatal = function (msg, error) {
            var categories = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                categories[_i - 2] = arguments[_i];
            }
            this.loadCategoryLogger();
            (_a = this._logger).fatal.apply(_a, [msg, error].concat(categories));
            var _a;
        };
        Category.prototype.resolved = function (msg, error) {
            var categories = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                categories[_i - 2] = arguments[_i];
            }
            this.loadCategoryLogger();
            (_a = this._logger).resolved.apply(_a, [msg, error].concat(categories));
            var _a;
        };
        Category.prototype.log = function (level, msg, error) {
            var categories = [];
            for (var _i = 3; _i < arguments.length; _i++) {
                categories[_i - 3] = arguments[_i];
            }
            this.loadCategoryLogger();
            (_a = this._logger).log.apply(_a, [level, msg, error].concat(categories));
            var _a;
        };
        Category.prototype.getCategoryPath = function () {
            var result = this.name;
            var cat = this.parent;
            while (cat != null) {
                result = cat.name + "#" + result;
                cat = cat.parent;
            }
            return result;
        };
        Object.defineProperty(Category.prototype, "id", {
            /**
             * Returns the id for this category (this
             * is for internal purposes only).
             * @returns {number} Id
             */
            get: function () {
                return this._id;
            },
            enumerable: true,
            configurable: true
        });
        Category.prototype.loadCategoryLogger = function () {
            if (!this._logger) {
                this._logger = CategoryService.CategoryServiceImpl.getInstance().getLogger(this);
            }
            if (typeof this._logger === "undefined" || this._logger === null) {
                throw new Error("Failed to load a logger for category (should not happen): " + this.name);
            }
        };
        Category.nextId = function () {
            return Category.currentId++;
        };
        Category.currentId = 1;
        return Category;
    }());
    var Category_2 = Category;


    var Category_1 = /*#__PURE__*/Object.defineProperty({
    	Category: Category_2
    }, '__esModule', {value: true});

    /**
     * Categorized service for logging, where logging is bound to categories which
     * can log horizontally through specific application logic (services, group(s) of components etc).
     * For the standard way of logging like most frameworks do these days, use LFService instead.
     * If you want fine grained control to divide sections of your application in
     * logical units to enable/disable logging for, this is the service you want to use instead.
     * Also for this type a browser plugin will be available.
     */
    var CategoryServiceFactory = (function () {
        function CategoryServiceFactory() {
            // Private constructor.
        }
        /**
         * Return a CategoryLogger for given ROOT category (thus has no parent).
         * You can only retrieve loggers for their root, when logging
         * you specify to log for what (child)categories.
         * @param root Category root (has no parent)
         * @returns {CategoryLogger}
         */
        CategoryServiceFactory.getLogger = function (root) {
            return CategoryService.CategoryServiceImpl.getInstance().getLogger(root);
        };
        /**
         * Clears everything, any registered (root)categories and loggers
         * are discarded. Resets to default configuration.
         */
        CategoryServiceFactory.clear = function () {
            return CategoryService.CategoryServiceImpl.getInstance().clear();
        };
        /**
         * Set the default configuration. New root loggers created get this
         * applied. If you want to reset all current loggers to have this
         * applied as well, pass in reset=true (the default is false). All
         * categories runtimesettings will be reset then as well.
         * @param config The new default configuration
         * @param reset If true, will reset *all* runtimesettings for all loggers/categories to these. Default is true.
         */
        CategoryServiceFactory.setDefaultConfiguration = function (config, reset) {
            if (reset === void 0) { reset = true; }
            CategoryService.CategoryServiceImpl.getInstance().setDefaultConfiguration(config, reset);
        };
        /**
         * Set new configuration settings for a category (and possibly its child categories)
         * @param config Config
         * @param category Category
         * @param applyChildren True to apply to child categories, defaults to false.
         */
        CategoryServiceFactory.setConfigurationCategory = function (config, category, applyChildren) {
            if (applyChildren === void 0) { applyChildren = false; }
            CategoryService.CategoryServiceImpl.getInstance().setConfigurationCategory(config, category, applyChildren);
        };
        return CategoryServiceFactory;
    }());
    var CategoryServiceFactory_2 = CategoryServiceFactory;


    var CategoryServiceFactory_1 = /*#__PURE__*/Object.defineProperty({
    	CategoryServiceFactory: CategoryServiceFactory_2
    }, '__esModule', {value: true});

    var __extends$5 = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();

    /**
     * Module containing bunch of JSON related stuff.
     */


    var JSONTypeImpl = (function () {
        function JSONTypeImpl(value) {
            this._value = value;
        }
        JSONTypeImpl.prototype.getValue = function () {
            return this._value;
        };
        JSONTypeImpl.prototype.toString = function () {
            var value = this.getValue();
            if (value != null) {
                return value.toString();
            }
            return "null";
        };
        return JSONTypeImpl;
    }());
    var JSONBooleanType = (function (_super) {
        __extends$5(JSONBooleanType, _super);
        function JSONBooleanType(value) {
            return _super.call(this, value) || this;
        }
        return JSONBooleanType;
    }(JSONTypeImpl));
    var JSONNumberType = (function (_super) {
        __extends$5(JSONNumberType, _super);
        function JSONNumberType(value) {
            return _super.call(this, value) || this;
        }
        return JSONNumberType;
    }(JSONTypeImpl));
    var JSONStringType = (function (_super) {
        __extends$5(JSONStringType, _super);
        function JSONStringType(value) {
            return _super.call(this, value) || this;
        }
        JSONStringType.prototype.toString = function () {
            var value = this.getValue();
            if (value != null) {
                return JSON.stringify(value.toString());
            }
            return "null";
        };
        return JSONStringType;
    }(JSONTypeImpl));
    var JSONObjectType = (function (_super) {
        __extends$5(JSONObjectType, _super);
        function JSONObjectType(value) {
            return _super.call(this, value) || this;
        }
        return JSONObjectType;
    }(JSONTypeImpl));
    var JSONArrayType = (function (_super) {
        __extends$5(JSONArrayType, _super);
        function JSONArrayType(value) {
            return _super.call(this, value) || this;
        }
        JSONArrayType.prototype.toString = function () {
            var value = this.getValue();
            if (value != null) {
                return value.toString();
            }
            return "null";
        };
        return JSONArrayType;
    }(JSONTypeImpl));
    var JSONNullType = (function (_super) {
        __extends$5(JSONNullType, _super);
        function JSONNullType() {
            return _super.call(this, null) || this;
        }
        JSONNullType.prototype.toString = function () {
            return "null";
        };
        return JSONNullType;
    }(JSONTypeImpl));
    var JSONTypeConverter = (function () {
        function JSONTypeConverter() {
        }
        JSONTypeConverter.toJSONType = function (value) {
            if (value === null) {
                return new JSONNullType();
            }
            if (typeof value === "string") {
                return new JSONStringType(value);
            }
            if (typeof value === "number") {
                return new JSONNumberType(value);
            }
            if (typeof value === "boolean") {
                return new JSONBooleanType(value);
            }
            if (value instanceof JSONObject) {
                return new JSONObjectType(value);
            }
            throw new Error("Type not supported for value: " + value);
        };
        return JSONTypeConverter;
    }());
    var JSONObject = (function () {
        function JSONObject() {
            this.values = new DataStructures.SimpleMap();
        }
        JSONObject.prototype.addBoolean = function (name, value) {
            this.checkName(name);
            JSONObject.checkValue(value);
            this.values.put(name, new JSONBooleanType(value));
            return this;
        };
        JSONObject.prototype.addNumber = function (name, value) {
            this.checkName(name);
            JSONObject.checkValue(value);
            this.values.put(name, new JSONNumberType(value));
            return this;
        };
        JSONObject.prototype.addString = function (name, value) {
            this.checkName(name);
            JSONObject.checkValue(value);
            this.values.put(name, new JSONStringType(value));
            return this;
        };
        JSONObject.prototype.addNull = function (name) {
            this.checkName(name);
            this.values.put(name, new JSONNullType());
            return this;
        };
        JSONObject.prototype.addArray = function (name, array) {
            this.checkName(name);
            JSONObject.checkValue(array);
            if (array == null) {
                throw new Error("Cannot add array as null");
            }
            this.values.put(name, new JSONArrayType(array));
            return this;
        };
        JSONObject.prototype.addObject = function (name, object) {
            this.checkName(name);
            JSONObject.checkValue(object);
            if (object == null) {
                throw new Error("Cannot add object as null");
            }
            this.values.put(name, new JSONObjectType(object));
            return this;
        };
        JSONObject.prototype.toString = function (pretty) {
            var _this = this;
            var comma = false;
            var buffer = new DataStructures.StringBuilder();
            buffer.append("{");
            this.values.keys().forEach(function (key) {
                var value = _this.values.get(key);
                if (value != null) {
                    if (comma) {
                        buffer.append(",");
                    }
                    buffer.append('"').append(key).append('":').append(value.toString());
                    comma = true;
                }
            });
            buffer.append("}");
            return buffer.toString();
        };
        JSONObject.prototype.checkName = function (name) {
            if (name == null || name === undefined) {
                throw new Error("Name is null or undefined");
            }
            if (this.values.exists(name)) {
                throw new Error("Name " + name + " is already present for this object");
            }
        };
        JSONObject.checkValue = function (value) {
            if (value === undefined) {
                throw new Error("Value is undefined");
            }
        };
        return JSONObject;
    }());
    var JSONObject_1 = JSONObject;
    var JSONArray = (function () {
        function JSONArray() {
            this.objects = [];
        }
        JSONArray.prototype.add = function (object) {
            if (object === undefined) {
                throw new Error("Object is not allowed to be undefined");
            }
            this.objects.push(JSONTypeConverter.toJSONType(object));
            return this;
        };
        JSONArray.prototype.toString = function (pretty) {
            var buffer = new DataStructures.StringBuilder();
            buffer.append("[");
            this.objects.forEach(function (value, index) {
                if (index > 0) {
                    buffer.append(",");
                }
                buffer.append(value.toString());
            });
            buffer.append("]");
            return buffer.toString();
        };
        return JSONArray;
    }());
    var JSONArray_1 = JSONArray;
    /**
     * Utility class that helps us convert things to and from json (not for normal usage).
     */
    var JSONHelper = (function () {
        function JSONHelper() {
        }
        JSONHelper.categoryToJSON = function (cat, recursive) {
            /*
             {
             "categories":
             [
             { id=1,
             name: "x",
             parent: null,
             logLevel: "Error"
             },
             { id=2,
             name: "y",
             parent: 1,
             logLevel: "Error"
             }
             ]
             }
             */
            var arr = new JSONArray();
            JSONHelper._categoryToJSON(cat, arr, recursive);
            var object = new JSONObject();
            object.addArray("categories", arr);
            return object;
        };
        JSONHelper._categoryToJSON = function (cat, arr, recursive) {
            var object = new JSONObject();
            object.addNumber("id", cat.id);
            object.addString("name", cat.name);
            object.addString("logLevel", LoggerOptions.LogLevel[cat.logLevel].toString());
            if (cat.parent != null) {
                object.addNumber("parent", cat.parent.id);
            }
            else {
                object.addNull("parent");
            }
            arr.add(object);
            if (recursive) {
                cat.children.forEach(function (child) {
                    JSONHelper._categoryToJSON(child, arr, recursive);
                });
            }
        };
        return JSONHelper;
    }());
    var JSONHelper_2 = JSONHelper;


    var JSONHelper_1 = /*#__PURE__*/Object.defineProperty({
    	JSONObject: JSONObject_1,
    	JSONArray: JSONArray_1,
    	JSONHelper: JSONHelper_2
    }, '__esModule', {value: true});

    var typescriptLogging = createCommonjsModule(function (module, exports) {
    function __export(m) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    Object.defineProperty(exports, "__esModule", { value: true });



    exports.ExtensionHelper = ExtensionHelper_1.ExtensionHelper;
    // Category related

    exports.AbstractCategoryLogger = AbstractCategoryLogger_1.AbstractCategoryLogger;

    exports.CategoryConsoleLoggerImpl = CategoryConsoleLoggerImpl_1.CategoryConsoleLoggerImpl;

    exports.CategoryDelegateLoggerImpl = CategoryDelegateLoggerImpl_1.CategoryDelegateLoggerImpl;

    exports.Category = Category_1.Category;

    exports.CategoryRuntimeSettings = CategoryRuntimeSettings_1.CategoryRuntimeSettings;

    exports.CategoryConfiguration = CategoryConfiguration_1.CategoryConfiguration;

    exports.CategoryMessageBufferLoggerImpl = CategoryMessageBufferImpl.CategoryMessageBufferLoggerImpl;

    exports.CategoryServiceFactory = CategoryServiceFactory_1.CategoryServiceFactory;

    exports.LoggerFactoryOptions = LoggerFactoryOptions_1.LoggerFactoryOptions;

    exports.LogGroupRule = LogGroupRule_1.LogGroupRule;

    exports.LFService = LFService_1.LFService;

    exports.AbstractLogger = AbstractLogger_1.AbstractLogger;

    exports.ConsoleLoggerImpl = ConsoleLoggerImpl_1.ConsoleLoggerImpl;

    exports.MessageBufferLoggerImpl = MessageBufferLoggerImpl_1.MessageBufferLoggerImpl;

    exports.CategoryLogFormat = LoggerOptions.CategoryLogFormat;
    exports.DateFormat = LoggerOptions.DateFormat;
    exports.DateFormatEnum = LoggerOptions.DateFormatEnum;
    exports.LogFormat = LoggerOptions.LogFormat;
    exports.LoggerType = LoggerOptions.LoggerType;
    exports.LogLevel = LoggerOptions.LogLevel;
    // Utilities

    exports.SimpleMap = DataStructures.SimpleMap;
    exports.LinkedList = DataStructures.LinkedList;
    __export(JSONHelper_1);

    exports.MessageFormatUtils = MessageUtils.MessageFormatUtils;
    /*
     Functions to export on TSL libarary var.
    */
    // Export help function
    function help() {
        /* tslint:disable:no-console */
        console.log("help()\n   ** Shows this help\n\n getLogControl(): LoggerControl\n   ** Returns LoggerControl Object, use to dynamically change loglevels for log4j logging.\n   ** Call .help() on LoggerControl object for available options.\n\n getCategoryControl(): CategoryServiceControl\n   ** Returns CategoryServiceControl Object, use to dynamically change loglevels for category logging.\n   ** Call .help() on CategoryServiceControl object for available options.\n");
        /* tslint:enable:no-console */
    }
    exports.help = help;
    // Export LogControl function (log4j)
    function getLogControl() {
        return new LogGroupControl.LoggerControlImpl();
    }
    exports.getLogControl = getLogControl;
    // Export CategoryControl function
    function getCategoryControl() {
        return new CategoryServiceControl.CategoryServiceControlImpl();
    }
    exports.getCategoryControl = getCategoryControl;

    });

    const options = new typescriptLogging.LoggerFactoryOptions()
        .addLogGroupRule(new typescriptLogging.LogGroupRule(new RegExp('.+'), typescriptLogging.LogLevel.Info));
    var factory = typescriptLogging.LFService.createNamedLoggerFactory('LoggerFactory', options);

    const playerStore = writable([]);
    const playerId = writable('');
    const undercoverCount = writable(0);
    const mrWhiteCount = writable(0);
    const connectionOpened = writable(false);
    const ownWord = writable('init');
    const playingState = writable('init');
    const logger = factory.getLogger('store');
    const socket = new WebSocket('ws://localhost:3000');
    socket.addEventListener('open', () => connectionOpened.set(true));
    socket.addEventListener('message', onMessageEvent);
    function onMessageEvent(event) {
        logger.info(`Received data from WS, ${event.data}`);
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
        if (get_store_value(connectionOpened)) {
            // console.log(`Sending ${JSON.stringify(message)}`);
            socket.send(JSON.stringify(message));
        }
    };

    /* src/Word.svelte generated by Svelte v3.31.2 */
    const file = "src/Word.svelte";

    function create_fragment(ctx) {
    	let main;

    	const block = {
    		c: function create() {
    			main = element("main");
    			add_location(main, file, 14, 0, 349);
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
    		id: create_fragment.name,
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

    function instance($$self, $$props, $$invalidate) {
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
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Word",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/GameBoard.svelte generated by Svelte v3.31.2 */
    const file$1 = "src/GameBoard.svelte";

    function create_fragment$1(ctx) {
    	let main;
    	let word;
    	let current;
    	word = new Word({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(word.$$.fragment);
    			add_location(main, file$1, 3, 0, 63);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(word, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(word.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(word.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(word);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("GameBoard", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GameBoard> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Word });
    	return [];
    }

    class GameBoard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GameBoard",
    			options,
    			id: create_fragment$1.name
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

    /* src/NameInput.svelte generated by Svelte v3.31.2 */
    const file$2 = "src/NameInput.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let label;
    	let t1;
    	let br;
    	let t2;
    	let input;
    	let t3;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			label = element("label");
    			label.textContent = "Input name";
    			t1 = space();
    			br = element("br");
    			t2 = space();
    			input = element("input");
    			t3 = space();
    			button = element("button");
    			button.textContent = "OK";
    			add_location(label, file$2, 31, 2, 730);
    			add_location(br, file$2, 32, 2, 760);
    			attr_dev(input, "type", "text");
    			add_location(input, file$2, 33, 2, 767);
    			add_location(button, file$2, 34, 2, 849);
    			add_location(main, file$2, 29, 0, 662);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, label);
    			append_dev(main, t1);
    			append_dev(main, br);
    			append_dev(main, t2);
    			append_dev(main, input);
    			set_input_value(input, /*message*/ ctx[0]);
    			append_dev(main, t3);
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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NameInput",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

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

    /* src/PlayerList.svelte generated by Svelte v3.31.2 */
    const file$3 = "src/PlayerList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (30:4) {#each players as player, _ (player)}
    function create_each_block(key_1, ctx) {
    	let p;
    	let html_tag;
    	let raw_value = formatName(/*$playerId*/ ctx[1], /*player*/ ctx[5]) + "";
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
    			add_location(p, file$3, 30, 6, 871);
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
    			if ((!current || dirty & /*$playerId, players*/ 3) && raw_value !== (raw_value = formatName(/*$playerId*/ ctx[1], /*player*/ ctx[5]) + "")) html_tag.p(raw_value);
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
    				if (!p_intro) p_intro = create_in_transition(p, /*receive*/ ctx[3], { key: /*$playerId*/ ctx[1] });
    				p_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (p_intro) p_intro.invalidate();
    			p_outro = create_out_transition(p, /*send*/ ctx[2], { key: /*$playerId*/ ctx[1] });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching && p_outro) p_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(30:4) {#each players as player, _ (player)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let main;
    	let h3;
    	let t1;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value = /*players*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*player*/ ctx[5];
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
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

    			add_location(h3, file$3, 28, 2, 796);
    			add_location(main, file$3, 27, 0, 787);
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

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$playerId, formatName, players*/ 3) {
    				each_value = /*players*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, main, fix_and_outro_and_destroy_block, create_each_block, null, get_each_context);
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
    		id: create_fragment$3.name,
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

    function instance$3($$self, $$props, $$invalidate) {
    	let players;
    	let $playerStore;
    	let $playerId;
    	validate_store(playerStore, "playerStore");
    	component_subscribe($$self, playerStore, $$value => $$invalidate(4, $playerStore = $$value));
    	validate_store(playerId, "playerId");
    	component_subscribe($$self, playerId, $$value => $$invalidate(1, $playerId = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PlayerList", slots, []);

    	const [send, receive] = crossfade({
    		duration: d => Math.sqrt(d * 200),
    		fallback(node) {
    			const style = getComputedStyle(node);
    			const transform = style.transform === "none" ? "" : style.transform;

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

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PlayerList> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		flip,
    		quintOut,
    		crossfade,
    		playerStore,
    		playerId,
    		formatName,
    		send,
    		receive,
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
    		if ($$self.$$.dirty & /*$playerStore*/ 16) {
    			 $$invalidate(0, players = $playerStore);
    		}
    	};

    	return [players, $playerId, send, receive, $playerStore];
    }

    class PlayerList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PlayerList",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/Settings.svelte generated by Svelte v3.31.2 */
    const file$4 = "src/Settings.svelte";

    function create_fragment$4(ctx) {
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
    			add_location(h3, file$4, 23, 2, 468);
    			add_location(p0, file$4, 24, 2, 490);
    			attr_dev(button0, "class", "svelte-i5r9n8");
    			add_location(button0, file$4, 25, 2, 510);
    			attr_dev(button1, "class", "svelte-i5r9n8");
    			add_location(button1, file$4, 27, 2, 614);
    			add_location(p1, file$4, 28, 2, 697);
    			attr_dev(button2, "class", "svelte-i5r9n8");
    			add_location(button2, file$4, 29, 2, 715);
    			attr_dev(button3, "class", "svelte-i5r9n8");
    			add_location(button3, file$4, 31, 2, 811);
    			add_location(main, file$4, 22, 0, 459);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/StartButton.svelte generated by Svelte v3.31.2 */
    const file$5 = "src/StartButton.svelte";

    function create_fragment$5(ctx) {
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text("Start");
    			button.disabled = /*disabledButton*/ ctx[0];
    			add_location(button, file$5, 20, 0, 716);
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
    		id: create_fragment$5.name,
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

    function instance$5($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StartButton",
    			options,
    			id: create_fragment$5.name
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
    		if(nextState === newState) return;
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
    	}
    }

    /* src/Lobby.svelte generated by Svelte v3.31.2 */
    const file$6 = "src/Lobby.svelte";

    // (15:1) {#if $state === "init"}
    function create_if_block_1(ctx) {
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
    			add_location(div, file$6, 15, 4, 482);
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(15:1) {#if $state === \\\"init\\\"}",
    		ctx
    	});

    	return block;
    }

    // (20:2) {#if $state === $playerId}
    function create_if_block(ctx) {
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
    			add_location(br0, file$6, 22, 6, 709);
    			add_location(br1, file$6, 24, 6, 742);
    			add_location(div, file$6, 20, 4, 619);
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
    		id: create_if_block.name,
    		type: "if",
    		source: "(20:2) {#if $state === $playerId}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let main;
    	let t;
    	let current;
    	let if_block0 = /*$state*/ ctx[1] === "init" && create_if_block_1(ctx);
    	let if_block1 = /*$state*/ ctx[1] === /*$playerId*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			add_location(main, file$6, 13, 0, 446);
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

    			if (/*$state*/ ctx[1] === /*$playerId*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*$state, $playerId*/ 3) {
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Lobby",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.31.2 */
    const file$7 = "src/App.svelte";

    // (13:1) {#if $state === 'init'}
    function create_if_block_1$1(ctx) {
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
    			add_location(div, file$7, 13, 2, 399);
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
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(13:1) {#if $state === 'init'}",
    		ctx
    	});

    	return block;
    }

    // (18:1) {#if $state === 'started'}
    function create_if_block$1(ctx) {
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
    			add_location(div, file$7, 18, 2, 524);
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
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(18:1) {#if $state === 'started'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let main;
    	let t;
    	let current;
    	let if_block0 = /*$state*/ ctx[0] === "init" && create_if_block_1$1(ctx);
    	let if_block1 = /*$state*/ ctx[0] === "started" && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(main, "class", "svelte-1fanpjj");
    			add_location(main, file$7, 11, 0, 365);
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

    			if (/*$state*/ ctx[0] === "started") {
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
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
