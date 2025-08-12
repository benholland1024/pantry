//// 
////  Landing
////

// Animate the landing logo
let _time = 0;
let _do_logo_anim = true;  //  Used to stop the animation
let _pink_path = ['M', 6735.02, 2025.59, 
  'C', 6735.93, 1993.81, 6677.83, 1961.57, 6636.07, 1961.35, 
  'C', 6594.31, 1961.13, 6436.35, 2028.31, 6453.6, 2079.15,
  'C', 6470.85, 2129.98, 6582.51, 2277.05, 6737.74, 2221.67,
  'C', 6807.57, 2180.82, 6699.53, 2144.18, 6697.23, 2116.05, 
  'C', 6700.74, 2082.12, 6734.11, 2057.36, 6735.02, 2025.59, 'Z'];

let _purple_path = ['M', 6735.02, 2025.59, 
  'C', 6735.93, 1993.81, 6677.83, 1961.57, 6636.07, 1961.35,
  'C', 6594.31, 1961.13, 6436.35, 2028.31, 6453.6, 2079.15, 
  'C', 6470.85, 2129.98, 6582.51, 2277.05, 6737.74, 2221.67,
  'C', 6807.57, 2180.82, 6699.53, 2144.18, 6697.23, 2116.05,
  'C', 6700.74, 2082.12, 6734.11, 2057.36, 6735.02, 2025.59, 'Z']
  
//  Given a path (see _pink_path above), return an array like [{x:1,y:2}, ...]
function path_to_verts(path) {
  let verts = [];
  let current = {x: null, y: null};
  for (let i = 0; i < path.length; i++) {
    if (typeof path[i] != 'number') {
      continue; //  We're looking at 'M' or 'C', etc
    } else if (current.x === null) {
      current.x = path[i];
    } else if (typeof path[i] == 'number') {
      current.y = path[i];
      verts.push(current);
      current = { x: null, y: null };
    }
  }
  return verts;
}
//  Given an array of vertices (like what's returned from path_to_verts), find the average x and y. 
function get_centeroid(vert_arr) {
  let avg = {x: 0, y: 0};
  for (let i = 0; i < vert_arr.length; i++) {
    avg.x += vert_arr[i].x;
    avg.y += vert_arr[i].y;
  }
  avg.x = avg.x / vert_arr.length;
  avg.y = avg.y / vert_arr.length;
  return avg;
}
//  Returns a unit vector from two points.
function get_unit_vector(x1, y1, x2, y2) {
  let vec = {x: x1 - x2, y: y1 - y2};
  let magnitude = Math.sqrt(vec.x**2 + vec.y**2);
  return { x: vec.x / magnitude, y: vec.y / magnitude };
}
//  From a list of vertices (like what's returned from path_to_verts), make a path.
function verts_to_path(verts) {
  let path = ['M', verts[0].x, verts[0].y];
  for (let i = 1; i < verts.length; i++) {
    if ((i-1) % 3 == 0) {
      path.push('C');
    }
    path.push(verts[i].x);
    path.push(verts[i].y);
  }
  path.push('Z');
  return path;
}
//  given a path (like what's returned from verts_to_path), return a string
function path_to_string(path) {
  let str = '';
  for (let i = 0; i < path.length; i++) {
    if (typeof path[i] == "string") {
      str += path[i];
    } else if (typeof path[i] == "number") {
      str += path[i].toString() + ',';
    }
  }
  return str;
}
//  Wobbles a path. Returns the path, wobbled.
function wobble_path(path) {
  let verts = path_to_verts(path);
  let centroid = get_centeroid(verts);
  for (let i = 0; i < verts.length; i++) {
    let vector = get_unit_vector(centroid.x, centroid.y, verts[i].x, verts[i].y);
    let offset = i;
    if (i == 0) { offset = verts.length-1; }
    let scale = .4 * Math.round(Math.sin(_time + offset) * 5) / 5;
    verts[i].x += scale * vector.x;
    verts[i].y += scale * vector.y;
  }
  return verts_to_path(verts);
}
//  Animate the logo!
function animate_landing_logo() {
  if (!_do_logo_anim) {
    return;
  }
  _time += 0.05;
  _pink_path = wobble_path(_pink_path);
  _purple_path = wobble_path(_purple_path);

  // let pink_verts = path_to_verts(_pink_path);
  // // console.log(pink_verts);
  // let pink_centroid = get_centeroid(pink_verts);
  // // console.log(pink_centroid);
  // // console.log(scale);
  // _time += 0.01;
  // for (let i = 0; i < pink_verts.length; i++) {
  //   let vector = get_unit_vector(pink_centroid.x, pink_centroid.y, pink_verts[i].x, pink_verts[i].y);
  //   let offset = i;
  //   if (i == 0) { offset = pink_verts.length-1; };
  //   let scale = .2 * Math.round(Math.sin(_time + offset) * 5) / 5;
  //   pink_verts[i].x += scale * vector.x;
  //   pink_verts[i].y += scale * vector.y;
  // }
  // _pink_path = verts_to_path(pink_verts);
  // let pink_centroid = get_centeroid(path_to_verts(_pink_path));
  // let rotate_str = `transform="rotate(${_time * 2} ${pink_centroid.x} ${pink_centroid.y})"`;
  
  let svg_text = `
    <svg width="350px" viewBox="-50 -50 429 484" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" 
      style="margin-top: 50px;fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;">
      <g transform="matrix(1,0,0,1,-6434.47,-1948.64)">
          <g transform="matrix(1,0,0,1,5947.58,1849.84)">   <!--  Pink blob  -->
              <g transform="matrix(1,0,0,1,-5965.4,-1849.84)">
                  <path id="svg-path-1" d="${path_to_string(_pink_path)}" style="fill:rgb(42,25,96);"/>
              </g>
          </g>
          <g transform="matrix(1,0,0,1,5947.58,1849.84)">   <!--  Blue blob  -->
              <g transform="matrix(0.545065,0.838394,-0.838394,0.545065,-1201.11,-6434.6)">
                  <path d="${path_to_string(_purple_path)}" style="fill:rgb(83,25,96);"/>
              </g>
          </g>
          <g transform="matrix(1,0,0,1,5947.58,1849.84)">   <!--     Can     -->
              <g transform="matrix(0.554038,0,0,0.554038,432.278,34.14)">
                  <g transform="matrix(0.525795,0,0,0.525795,-13300.1,-5217.61)">
                      <use xlink:href="#_Image2" x="25720" y="10241" width="586px" height="911px"/>
                  </g>
              </g>
          </g>
      </g>
      <defs>
          <image id="_Image2" width="606px" height="931px" href="/assets/can-only.png" 
            title="A can of DataPantry soup."
            alt="A soup can with 'DataPantry' written on it, in the style of a Campbell's soup can."
          />
      </defs>
    </svg>`;
  document.getElementById('svg-container').innerHTML = svg_text;
  requestAnimationFrame (animate_landing_logo);
}

function render_landing() {
  window.history.pushState({ },"", `/`);
  unrender_all();
  minimize_side_bar();
  if (!_current_user.username) {
    render_auth_buttons();
    document.getElementById('landing-reg-btn').style.display = 'block'; //  Action btn on landing page
    document.getElementById('landing-dash-btn').style.display = 'none'; 
  } else {
    render_user_profile_button();
    document.getElementById('landing-reg-btn').style.display = 'none';  //  Action btn on landing page
    document.getElementById('landing-dash-btn').style.display = 'block';
  }
  document.getElementById('top-bar-title').innerHTML = '<h1>DataPantry</h1>'
  document.getElementById('landing').style.display = 'block';
  // setInterval(() => {
  //   // requestAnimationFrame(animate_landing_logo);
  // }, 100);
  _do_logo_anim = true;
  animate_landing_logo();

}