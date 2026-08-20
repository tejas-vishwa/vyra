/* VYRA - Interactive India Smart Grid Deployment Map */
const indiaNodesData = {
  delhi: {
    name: 'Delhi NCR Pilot Zone',
    discom: 'TPDDL & BSES Rajdhani',
    transformers: '1,420 Active Units',
    health: '98.4%',
    lossesSaved: '3.8 MW/day',
    status: 'Optimal'
  },
  mumbai: {
    name: 'Mumbai Coastal Pilot Zone',
    discom: 'Adani Electricity & BEST',
    transformers: '1,890 Active Units',
    health: '99.1%',
    lossesSaved: '5.2 MW/day',
    status: 'Optimal'
  },
  bengaluru: {
    name: 'Bengaluru Tech Pilot Zone',
    discom: 'BESCOM Zone 1 & 2',
    transformers: '2,150 Active Units',
    health: '97.9%',
    lossesSaved: '4.6 MW/day',
    status: 'Optimal'
  },
  varanasi: {
    name: 'Varanasi PuVVNL Pilot Zone',
    discom: 'PuVVNL Discom',
    transformers: '840 Active Units',
    health: '96.5%',
    lossesSaved: '2.9 MW/day',
    status: 'Predictive Monitoring'
  },
  kolkata: {
    name: 'Kolkata Metro Pilot Zone',
    discom: 'CESC & WBSEDCL',
    transformers: '1,260 Active Units',
    health: '98.0%',
    lossesSaved: '3.4 MW/day',
    status: 'Optimal'
  },
  chennai: {
    name: 'Chennai Energy Pilot Zone',
    discom: 'TANGEDCO North',
    transformers: '1,510 Active Units',
    health: '98.7%',
    lossesSaved: '4.1 MW/day',
    status: 'Optimal'
  },
  hyderabad: {
    name: 'Hyderabad Cyber Pilot Zone',
    discom: 'TSSPDCL Central',
    transformers: '1,380 Active Units',
    health: '99.0%',
    lossesSaved: '3.9 MW/day',
    status: 'Optimal'
  }
};

function setupIndiaMapInteractivity() {
  const nodeElements = document.querySelectorAll('.map-node');
  const cardTitle = document.getElementById('mapNodeTitle');
  const cardDiscom = document.getElementById('mapNodeDiscom');
  const cardUnits = document.getElementById('mapNodeUnits');
  const cardHealth = document.getElementById('mapNodeHealth');
  const cardLosses = document.getElementById('mapNodeLosses');

  nodeElements.forEach(node => {
    node.addEventListener('mouseenter', (e) => {
      const cityKey = e.currentTarget.dataset.city;
      const data = indiaNodesData[cityKey];
      if (!data) return;

      if (cardTitle) cardTitle.textContent = data.name;
      if (cardDiscom) cardDiscom.textContent = data.discom;
      if (cardUnits) cardUnits.textContent = data.transformers;
      if (cardHealth) cardHealth.textContent = data.health;
      if (cardLosses) cardLosses.textContent = data.lossesSaved;

      nodeElements.forEach(n => n.classList.remove('active-node'));
      e.currentTarget.classList.add('active-node');
    });
  });
}

document.addEventListener('DOMContentLoaded', setupIndiaMapInteractivity);
