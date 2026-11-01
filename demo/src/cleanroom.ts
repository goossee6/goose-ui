import { mount } from 'svelte'
import 'goose-ui/styles/theme.css'
import CleanRoom from './lib/cleanroom/CleanRoom.svelte'

mount(CleanRoom, { target: document.getElementById('app')! })
