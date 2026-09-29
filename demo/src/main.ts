import { mount } from 'svelte'
import { initTheme } from 'goose-ui'
import App from './App.svelte'
import 'goose-ui/styles/theme.css'

initTheme()
mount(App, { target: document.getElementById('app')! })