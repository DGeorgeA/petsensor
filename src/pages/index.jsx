import Layout from "./Layout.jsx";

import Landing from "./Landing";

import PredictiveMaintenance from "./PredictiveMaintenance";

import CarOps from "./CarOps";

import DetailingMarketplace from "./DetailingMarketplace";

import DetailingStudio from "./DetailingStudio";

import ShopOnboarding from "./ShopOnboarding";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Landing: Landing,
    
    PredictiveMaintenance: PredictiveMaintenance,
    
    CarOps: CarOps,
    
    DetailingMarketplace: DetailingMarketplace,
    
    DetailingStudio: DetailingStudio,
    
    ShopOnboarding: ShopOnboarding,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Landing />} />
                
                
                <Route path="/Landing" element={<Landing />} />
                
                <Route path="/PredictiveMaintenance" element={<PredictiveMaintenance />} />
                
                <Route path="/CarOps" element={<CarOps />} />
                
                <Route path="/DetailingMarketplace" element={<DetailingMarketplace />} />
                
                <Route path="/DetailingStudio" element={<DetailingStudio />} />
                
                <Route path="/ShopOnboarding" element={<ShopOnboarding />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}