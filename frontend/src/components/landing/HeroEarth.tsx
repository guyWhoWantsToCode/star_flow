import { useEffect, useRef } from 'react'

export default function HeroEarth() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const layer = ref.current!.parentElement!
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    const update = () => {
      frame = 0
      layer.style.setProperty('--earth-scroll', `${motion.matches ? 0 : Math.min(scrollY * .055, 65)}px`)
    }
    const follow = () => { if (!frame) frame = requestAnimationFrame(update) }
    window.addEventListener('scroll', follow, { passive: true })
    motion.addEventListener('change', follow)
    update()
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', follow)
      motion.removeEventListener('change', follow)
    }
  }, [])
  useEffect(() => {
    const canvas = ref.current!
    const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false })
    if (!gl) return
    const shaders: WebGLShader[] = []
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!
      gl.shaderSource(shader, source); gl.compileShader(shader); shaders.push(shader)
      return shader
    }
    const program = gl.createProgram()!
    gl.attachShader(program, compile(gl.VERTEX_SHADER, 'attribute vec2 p; varying vec2 uv; void main(){uv=p;gl_Position=vec4(p,0.,1.);}'))
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, `
      precision mediump float; varying vec2 uv; uniform sampler2D surface; uniform float rotation;
      void main(){
        vec2 p=uv*1.08; float r=length(p);
        if(r>1.0){float halo=exp(-(r-1.0)*55.0)*0.32;gl_FragColor=vec4(.18,.53,.9,halo);return;}
        vec3 n=vec3(p,sqrt(1.0-dot(p,p)));
        float longitude=atan(n.x,n.z)/6.2831853+0.5+rotation;
        float latitude=asin(n.y)/3.14159265+0.5;
        vec3 color=texture2D(surface,vec2(fract(longitude),latitude)).rgb;
        float light=max(dot(n,normalize(vec3(-.6,.4,1.))),0.0);
        color*=.12+.88*light;
        float rim=pow(1.0-n.z,3.0);
        color+=vec3(.08,.3,.65)*rim*(.3+.7*light);
        color*=1.08;
        gl_FragColor=vec4(color,1.0-smoothstep(.995,1.0,r));
      }`))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      shaders.forEach(shader => gl.deleteShader(shader)); gl.deleteProgram(program); return
    }
    gl.useProgram(program)
    const buffer = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW)
    const attribute = gl.getAttribLocation(program, 'p')
    gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0)
    const texture = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D,texture)
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)
    const rotation = gl.getUniformLocation(program,'rotation')
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let frame=0, angle=.15, previous=0, visible=true, ready=false, disposed=false
    const draw = () => { gl.uniform1f(rotation,angle); gl.drawArrays(gl.TRIANGLES,0,6) }
    const tick = (time: number) => {
      if(previous) angle+=Math.min(time-previous,100)/45000
      previous=time; draw(); frame=requestAnimationFrame(tick)
    }
    const update = () => {
      cancelAnimationFrame(frame); previous=0
      if(!ready || disposed) return
      draw()
      if(visible && !document.hidden && !motion.matches) frame=requestAnimationFrame(tick)
    }
    const resize = () => {
      const size=Math.min(1200,Math.round(canvas.clientWidth*Math.min(devicePixelRatio || 1,1.5)))
      canvas.width=canvas.height=size; gl.viewport(0,0,size,size); update()
    }
    const image = new Image()
    image.onload = () => {
      if(disposed) return
      gl.bindTexture(gl.TEXTURE_2D,texture)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true)
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image)
      ready=true; resize()
    }
    image.src='/textures/earth.jpg'
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;update()})
    const sizing=new ResizeObserver(resize)
    observer.observe(canvas); sizing.observe(canvas)
    motion.addEventListener('change',update); document.addEventListener('visibilitychange',update)
    return () => {
      disposed=true; image.onload=null; cancelAnimationFrame(frame); observer.disconnect(); sizing.disconnect()
      motion.removeEventListener('change',update); document.removeEventListener('visibilitychange',update)
      gl.deleteTexture(texture); gl.deleteBuffer(buffer); shaders.forEach(shader=>gl.deleteShader(shader)); gl.deleteProgram(program)
    }
  }, [])
  return <div className="hero-earth" aria-hidden="true"><canvas ref={ref}/></div>
}
